## Context

`vendas` is the most orchestration-heavy module of the Atos Store PDV. A counter sale is the point where three previously independent modules converge: `estoque` (stock), `caixa` (cash session), and payment capture. The codebase already follows a Genérico layered pattern — pure domain in `modules/*`, NestJS+Fastify+Prisma backend in `apps/backend/src/modules/*`, Next.js web in `apps/frontend/src/modules/*`, and a Clean Architecture / MVVM Flutter app. Cross-module communication is done **only via ports**: `estoque` already exposes `inventory-sales-port` (`EstoquePort.darBaixa/estornar`, done), and `caixa` exposes a `cash-sales-port` (`caixaAbertoDoOperador/registrarVenda`, defined in the in-progress `caixa-module` change). There is no `pagamentos` module.

This change adds `vendas` as the aggregate owner of `Venda` + `ItemVenda` + `Pagamento`, with `criar/adicionar/remover/aplicar-desconto/finalizar/cancelar` write use cases and `buscar/listar/resumo` read use cases. The `canal` is fixed to `PDV` for MVP 1.

## Goals / Non-Goals

**Goals:**
- Own the `Venda` aggregate and its lifecycle `ABERTA → CONCLUIDA | CANCELADA`, with `CONCLUIDA` immutable.
- Finalize a sale as a single atomic transaction: validate stock → take stock down (`VENDA_PDV`) → persist payments → register cash `VENDA` movement → `CONCLUIDA`, with full rollback on any step failure.
- Keep the calculation rule consistent across layers: `total = Σ itens − desconto`, `Σ pagamentos = total`, `precoUnitario` is a snapshot.
- Orchestrate `estoque` and `caixa` only through `EstoqueGateway`/`CaixaGateway` ports declared in `modules/vendas/provider/`.
- Guarantee unique sequential `numero` under concurrency.

**Non-Goals:**
- No separate `pagamentos` module and no `PagamentoGateway` in MVP 1 — payments are owned by `vendas` (decided with the user).
- No online/marketplace channel — `canal` is fixed `PDV`.
- No partial finalize, layaway, returns after close, or split-shipment.
- No re-opening a `CONCLUIDA` sale; no editing closed-session sales.

## Decisions

### D1: Payments owned by `vendas` (no `pagamentos` module in MVP 1)
`Pagamento` (`forma`, `valor`) is a child of the `Venda` aggregate, persisted in `prisma/models/vendas.model.prisma`. `finalizar-venda` writes payment rows directly inside its transaction and enforces `Σ pagamentos = total` (`PAYMENT_MISMATCH`).
- **Why:** the `pagamentos` module does not exist; building it now would balloon scope. Payment data for a counter sale is simple (`forma` + `valor`) and naturally part of the sale.
- **Alternative considered:** declare a `PagamentoGateway` and stub it / build a minimal `pagamentos` module. Rejected for MVP — extra module, extra port, extra wiring with no behavior gain yet. Migration path: extract a `pagamentos` module later behind a `PagamentoGateway` without touching the sale lifecycle (see Migration Plan).

### D2: Ports consumed declared in `vendas/provider/`
`EstoqueGateway` (validate balance, `darBaixa(variacaoId, qtd, origemVendaId)` with `VENDA_PDV`, `estornar(...)` for `DEVOLUCAO`) and `CaixaGateway` (`caixaAbertoDoOperador(usuarioId)`, `registrarVenda(sessaoId, valor)`, reverse) are interfaces in the domain. Backend adapters implement them by delegating to the `estoque`/`caixa` sales ports.
- **Why:** keeps the domain pure and matches the established pattern (the domain is the source of truth for the contract; the backend binds it). Mirrors how `caixa` consumes nothing and `estoque` exposes its port.
- **Alternative considered:** have `vendas` import `estoque`/`caixa` use cases directly. Rejected — breaks module boundaries and makes the domain untestable without those modules.

### D3: `finalizar-venda` / `cancelar-venda` atomic via `runInTransaction`
The orchestration order (validate → stock down → payments → cash → status) runs inside one DB transaction using the existing `TransactionManager`/`runInTransaction`. The gateways receive the transactional context so stock, cash, payment, and status commit or roll back together. Domain unit tests assert rollback semantics with fakes; backend integration tests assert it against a real DB by injecting a failure at the payment/cash step.
- **Why:** the central invariant is "no partial sale". A non-transactional sequence could take stock down and then fail to record cash, corrupting balances.
- **Alternative considered:** saga with compensating actions across modules. Overkill for a single-DB monolith; a DB transaction is simpler and stronger here.

### D4: Unique sequential `numero` via DB sequence/atomic counter
`numero` is generated from a Postgres sequence (or an atomic counter row) and backed by a unique constraint, assigned at creation/finalization so concurrent sales never collide.
- **Why:** application-side `max(numero)+1` races under concurrency. The DB guarantees atomicity.
- **Alternative considered:** UUID-only. Rejected — operators need a human-readable sequential receipt number (RF-VND-11).

### D5: `precoUnitario` snapshot at add-item time
`adicionar-item` resolves the variation (by `variacaoId`/`sku`/`codigoBarras`) and copies its current price into the line. The line never re-reads the catalog price afterward.
- **Why:** the sale must be stable against later price changes (RF-VND-03 acceptance).

### D6: `Decimal` money everywhere
All monetary fields (`subtotal`, `desconto`, `total`, `precoUnitario`, payment `valor`) are Prisma `Decimal`; the domain uses a money value object, never `float`.
- **Why:** float rounding would break the `Σ pagamentos = total` equality check.

### D7: Identity from auth context, not body
`usuarioId` and `sessaoCaixaId` come from the authenticated request; `CriarVendaInDTO` is empty. The controller reads the operator's open session via `CaixaGateway` to bind `sessaoCaixaId`.
- **Why:** prevents an operator from creating a sale under another operator/session.

## Risks / Trade-offs

- **`caixa` cash-sales-port not yet applied** → The backend `CaixaGateway` adapter cannot be wired until the `caixa-module` change lands. Mitigation: sequence this change's backend tasks after `caixa-module`; the domain (ports + use cases) can be built and unit-tested with fakes immediately.
- **Payments coupled to `vendas`** → A future `pagamentos` module means a data migration of payment rows. Mitigation: keep `Pagamento` minimal (`forma`, `valor`, `vendaId`) so extraction is mechanical (D1 migration path).
- **Cross-module rollback correctness** → If a gateway performs work outside the shared transaction, rollback would be incomplete. Mitigation: gateways MUST operate within the passed transactional context; integration test injects a failure after stock take-down and asserts stock is restored.
- **Cancel vs. session close race** → A sale could be cancelled just as the session closes. Mitigation: `cancelar-venda` re-checks session state inside the transaction; the `caixa` `PENDING_SALE_IN_SESSION` invariant already prevents closing with an `ABERTA` sale.
- **`numero` gaps on rolled-back finalizations** → A sequence consumed by a rolled-back transaction leaves a gap. Mitigation: accept gaps (sequential, not gapless, is the requirement); assign `numero` at creation so finalization rollback does not waste it, or document gaps as acceptable.

## Migration Plan

1. Land `caixa-module` (provides `cash-sales-port`) before wiring the backend `CaixaGateway` adapter.
2. Build `modules/vendas` domain (entities, VOs, ports, use cases, errors) + unit tests with fake gateways — no infra dependency.
3. Add `prisma/models/vendas.model.prisma`, generate client, create the versioned SQL migration (unique `numero` sequence + FKs).
4. Implement the Prisma adapter and the `EstoqueGateway`/`CaixaGateway` adapters; wire `VendasModule`.
5. Add controllers + DTOs + Swagger; integration/e2e tests (including injected-failure rollback).
6. Build web and mobile features in parallel against the contracted API.
- **Rollback strategy:** the feature is additive; reverting means removing `VendasModule` wiring and the Prisma model migration. No existing module depends on `vendas`.
- **Future `pagamentos` extraction:** introduce a `pagamentos` module + `PagamentoGateway`, move payment persistence behind the port, backfill existing payment rows; the sale lifecycle and `Σ pagamentos = total` invariant stay unchanged.

## Open Questions

- Should `numero` be assigned at `criar-venda` (gaps on cancelled/abandoned sales) or at `finalizar-venda` (gaps only on rolled-back finalizations)? Leaning toward assignment at finalization so abandoned `ABERTA` carts don't consume numbers.
- Allowed payment `forma` values for MVP (e.g. `DINHEIRO`, `CARTAO`, `PIX`) and whether only cash payments feed the `caixa` `VENDA` movement (`vendasDinheiro`) vs. the full `total`. Current spec registers the full `total`; revisit if non-cash should not hit the drawer.
