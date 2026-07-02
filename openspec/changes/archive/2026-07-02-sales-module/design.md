## Context

The `sales` module is the PDV bounded context and the **last** in the monorepo build order (it orchestrates `catalog` and `inventory`). It is **already implemented** in two layers, in Portuguese, keyed by `variacaoId`, money in **cents**:

- **Domain** `modules/sales/src/` — two aggregates:
  - `cash-session/` — `SessaoCaixa` (root: `abrir`/`restore`/`fechar`), `MovimentacaoCaixa` (child: `criar` for SUPRIMENTO/SANGRIA, sealed `criarVenda`), VOs `ValorMonetario`/`ValorPositivo`, ports `CaixaRepository`/`CaixaQuery`/`CaixaPort`, use cases (`AbrirCaixa`, `FecharCaixa`, `RegistrarSuprimento`, `RegistrarSangria`, `CaixaAbertoDoOperador`, `ResumoSessao`, `ListarMovimentacoes`), sealed `CaixaPortService`.
  - `venda/` — `Venda` (root: `abrir`/`hydrate`, `adicionarItem`/`removerItem`/`alterarQuantidadeItem`, `aplicarDesconto`, `adicionarPagamento`/`definirPagamentos`, `atribuirNumero`, `concluir`, `cancelar`), children `ItemVenda`/`Pagamento`, VOs `Dinheiro`/`QuantidadeVendida`/`Desconto`, enums `StatusVenda`/`CanalVenda`/`FormaPagamento`/`TipoDesconto`, ports `VendasRepository`/`VendasQuery`/`CaixaGateway`/`EstoqueGateway`, use cases (`CriarVenda`, `AdicionarItem`, `RemoverItem`, `AplicarDesconto`, `FinalizarVenda`, `CancelarVenda`, `BuscarVenda`, `ListarVendas`, `ResumoVendas`), `VendaCalculatorService`.
- **Backend** `apps/backend/src/modules/sales/` (+ nested `cash-session/`) — `VendasCommands/QueriesController`, `CaixaCommands/QueriesController`, HTTP DTOs (reais↔cents at the boundary via `adapters/money.ts`), adapters (`VendasPrismaRepository`, `VendasPrismaQuery`, `VariacaoPrismaReader`, `EstoqueGatewayAdapter`, `CaixaGatewayAdapter`, `CaixaPrismaRepository`, `CaixaPrismaQuery`, `StubPendingSalePredicate`), Prisma models (`SessaoCaixa`, `MovimentacaoCaixa`, `Venda`, `ItemVenda`, `Pagamento`), `SalesModule`/`CaixaModule`.
- **Web** `apps/web` and **Mobile** `apps/mobile` — **do not exist yet** for sales.

Shared infra is in place: `@repo/shared` exposes `TransactionContext`/`TransactionManager` (implemented by `PrismaService.runInTransaction`); auth guards/decorators (`JwtGuard`, `RolesGuard`, `@CurrentUser`, `@Papeis`) live in `apps/backend/src/shared`. The inventory side exposes `EstoquePort.darBaixa/estornar(…, tx?)` (per the `inventory-module` change) and a `CatalogVariationReader` for price/active.

This change is a **reconciliation + greenfield-extension**, not a rebuild. Reconciliation decisions were confirmed with the user and recorded in the `sales-module-scope` memory: keep the rich venda model, rename the caixa aggregate to Portuguese, and cover all four layers in one change.

## Goals / Non-Goals

**Goals:**
- Establish the RN of record as OpenSpec capabilities for caixa, venda, the cross-module transaction, the two backend APIs, and the new web/mobile surfaces.
- Rename the caixa aggregate to the Portuguese vocabulary (`StatusSessaoCaixa = {ABERTA, FECHADA}`; PT `CaixaError` codes) with no behavior change beyond the rename.
- Enforce owner/admin scoping (RN02/RN03/RN04) end-to-end: domain checks + backend guards + ADMIN `GET /caixa`.
- Make the pending-sale close-guard real (RN blocked-close) by binding vendas into a `PendingSalePredicate`.
- Complete the sealed `CaixaPort` (`isSessaoAberta`, `estornarVenda`, `registrarVenda(tx?)`) so `CaixaGateway` flows through the port and RN09 runs in a single transaction (sale + stock + cash), with full rollback/estorno on failure.
- Deliver the ADMIN-only web "Caixas" read panel and the mobile PDV core (abrir/fechar/vender/cancelar + own-history).

**Non-Goals:**
- Reintroducing the "venda imutável / uma forma de pagamento" simplification — superseded (Decision recorded in memory).
- A web PDV (selling on web) — the selling flow is mobile-only for this MVP; web is read-only admin.
- New payment channels beyond `CanalVenda.PDV` or new `FormaPagamento` values.
- Changing inventory/catalog rules — sales only *consumes* their ports; any inventory rule work belongs to the `inventory-module` change.
- Renaming the venda aggregate to Portuguese — venda error codes stay English by contract (`SALE_NOT_FOUND`, `PAYMENT_MISMATCH`, …).

## Decisions

### 1. Keep the rich venda lifecycle as the rule of record
The code already implements `ABERTA → CONCLUIDA | CANCELADA` with split payments, discount, and cancel-with-estorno; the prompt's scope describes exactly this. Writing specs to a simpler model would delete working, tested behavior.
- **Chosen:** specs codify the existing lifecycle. Only `CONCLUIDA` is immutable (RN11); `ABERTA` accepts item/discount/payment writes; `CANCELADA` reverses stock+cash. `concluir()` requires ≥1 item and `Σ pagamentos == total` (`PAYMENT_MISMATCH`, RN12).
- **Alternative (rejected):** simplify to the original doc — discards code and contradicts the prompt scope.

### 2. Rename the caixa aggregate to Portuguese, venda stays English
The repo convention is Portuguese; the prompt lists PT caixa terms explicitly, but keeps venda errors in English.
- **Chosen:** `StatusSessaoCaixa = {ABERTA, FECHADA}` and `CaixaError = {CAIXA_NAO_ENCONTRADO, CAIXA_JA_ABERTO, CAIXA_JA_FECHADO, NAO_E_DONO_DO_CAIXA, ACESSO_NEGADO, VENDA_PENDENTE_NO_FECHAMENTO, VALOR_INVALIDO}`. Map old codes 1:1: `CASH_SESSION_ALREADY_OPEN→CAIXA_JA_ABERTO`, `CASH_SESSION_NOT_FOUND→CAIXA_NAO_ENCONTRADO`, `CASH_SESSION_ALREADY_CLOSED→CAIXA_JA_FECHADO`, `PENDING_SALE_IN_SESSION→VENDA_PENDENTE_NO_FECHAMENTO`, `VALOR_*_INVALIDO→VALOR_INVALIDO`. Add the two scoping codes (`NAO_E_DONO_DO_CAIXA`, `ACESSO_NEGADO`) that don't exist yet.
- **Alternative (rejected):** keep English caixa codes — cheaper, but diverges from the prompt and the module's Portuguese identity; the rename is a mechanical find/replace bounded to caixa domain + error mapper + tests.
- **Consequence:** the DB `status` string values change from `ABERTO/FECHADO` to `ABERTA/FECHADA`; the RN01 partial unique index predicate (`WHERE status='ABERTA'`) and any seed/data must move with it in the migration.

### 3. Sealed `CaixaPort` is the only cross-aggregate surface; complete it for RN09
Today `CaixaGatewayAdapter` reaches into `CaixaPrismaRepository` for `isSessaoAberta` and cancel-time reversals, bypassing the sealed port, and `CaixaPort.registrarVenda` has no `tx?`. RN09 needs the caixa write to join the sale's transaction.
- **Chosen:** extend `CaixaPort` to `{ caixaAbertoDoOperador(usuarioId), isSessaoAberta(sessaoId), registrarVenda(sessaoId, valor, tx?), estornarVenda(sessaoId, valor, tx?) }`, implemented by `CaixaPortService` (the only surface that creates `VENDA`/reversal movements). `CaixaGatewayAdapter` binds `CaixaGateway → CaixaPort` and stops touching the repository directly.
- **Alternative (rejected):** keep the adapter reading the repo — leaks caixa persistence into vendas and can't guarantee the movement is on the sale's `tx`.

### 4. Single transaction for finalizar/cancelar (RN07/RN08/RN09)
`FinalizarVenda`/`CancelarVenda` receive the `TransactionManager` and wrap: (a) `venda.concluir()/cancelar()` persistence, (b) `EstoqueGateway.darBaixa/estornar(…, tx)`, (c) `CaixaGateway.registrarVenda/estornarVenda(…, tx)` — all on one `runInTransaction` context.
- **Chosen:** the use case opens `runInTransaction`, passes `tx` to both gateways and the repository `update`. Any failure (insufficient stock, payment mismatch surfaced pre-tx, DB error) aborts the whole transaction — stock and cash are reversed by rollback, not by compensating writes. `cancelar` is additionally blocked when the session already closed (`CASH_SESSION_CLOSED`, checked via `isSessaoAberta`).
- **Alternative (rejected):** saga/compensation across separate transactions — unnecessary for a single-DB PDV and weaker than an ACID rollback.

### 5. Real `PendingSalePredicate` for blocked-close
`StubPendingSalePredicate` always answers "no pending sale", so RN blocked-close is unenforced.
- **Chosen:** a `PendingSalePredicate` implemented in the backend against vendas (an `ABERTA` sale on the session ⇒ pending), injected into `FecharCaixa`; closing fails with `VENDA_PENDENTE_NO_FECHAMENTO`. This is a vendas→caixa binding wired at the Nest module level to avoid a domain cycle.
- **Alternative (rejected):** query vendas from inside the caixa domain — creates an aggregate dependency; the predicate port keeps caixa domain ignorant of venda internals.

### 6. Owner/admin scoping split between domain and backend
- **Chosen:** the **backend** derives `usuarioId`/`role` from the JWT (`@CurrentUser`, `@Papeis`) — never from the body — and passes them into use cases; **domain** use cases enforce ownership (`NAO_E_DONO_DO_CAIXA` on fechar/sangria/suprimento by a non-owner) and read-scope (`ACESSO_NEGADO` when a non-ADMIN reads someone else's caixa/venda). ADMIN bypasses the read-scope and gets `GET /caixa` list-all (RN04). Route guards are authoritative; any web hiding is reinforcement.
- **Alternative (rejected):** scoping only in controllers — leaves the domain exploitable by other callers and untestable at the unit level.

### 7. Web is read-only admin; mobile owns the PDV
- **Chosen:** web adds an ADMIN "Caixas" nav entry + page guard and read pages (list/filter + detail with resumo and linked sales), reusing the existing shell and shadcn tokens. Mobile implements the full PDV in Clean Architecture/MVVM (`lib/domain/{caixa,venda}`, `lib/data/{caixa,venda}`, UI + get_it modules + routes).
- **Alternative (rejected):** build a web PDV too — out of MVP scope and duplicates the mobile flow.

## Risks / Trade-offs

- **Caixa enum/error rename ripples across layers** → keep it a mechanical 1:1 map (Decision 2); grep `ABERTO|FECHADO|CASH_SESSION_|PENDING_SALE_IN_SESSION|VALOR_ABERTURA_INVALIDO|VALOR_FECHAMENTO_INVALIDO|VALOR_MOVIMENTACAO_INVALIDO` across `modules/sales` + `apps/backend` before declaring done; update the error mapper and tests in the same commit.
- **DB `status` value rename is a data migration** → the migration must rewrite existing `ABERTO→ABERTA`/`FECHADO→FECHADA` rows and re-create the partial unique index with the new predicate atomically; rollback re-maps back. Little/no production data expected, but the migration must be idempotent.
- **RN09 rollback correctness is the highest-risk path** → cover with an orchestration test (`vendas.orchestration.spec`) that forces stock failure after cash registration (and vice-versa) and asserts the sale stays `ABERTA` and no stock/cash movement persisted. Assert both gateways received the **same** `tx`.
- **Wiring vendas into the caixa close-guard risks a module cycle** → resolve the predicate at the Nest DI layer (backend), not in the domain; the domain only sees the `PendingSalePredicate` port.
- **`GET /caixa` list-all could leak across operators if the guard regresses** → enforce `@Papeis(ADMIN)` on the route AND assert an OPERADOR gets 403 in a controller test; non-admin reads of a foreign session return `ACESSO_NEGADO`→403.
- **Web/mobile greenfield is large** → per the layer split, web and mobile proceed in parallel only after the backend API is contracted (routes/DTOs frozen by the `cash-session-api`/`sale-api` specs).

## Migration Plan

1. **Domain** — rename caixa enum/error codes; extend `CaixaPort`; add owner/access checks and the real `PendingSalePredicate` port; keep venda as-is; jest green. (Blocking.)
2. **Backend** — propagate the rename into adapters/DTOs/error mapper; add ADMIN `GET /caixa`; wire the real pending-sale predicate and the transactional finalizar/cancelar (`tx` to both gateways); Prisma migration (rewrite `status` values + re-create RN01 partial unique index); build + tests green.
3. **Web** and **Mobile** — in parallel once the API is frozen: web admin read panel; mobile PDV core.
4. **Review** — end-to-end: abrir/fechar with resumo (RN05), sale flow criar→itens→desconto→pagamentos→finalizar, RN09 rollback/estorno, RN11 immutability, RN12 `Σ == total`, RN01 one-open, RN02/RN03/RN04 scoping; monorepo build + tests + lint.

**Rollback:** the change is additive at the spec level; code rollback is per-layer (revert the layer's commit). The DB migration has a documented down-migration (re-map `status` values, restore the old index predicate). No data loss — the rename preserves rows.

## Open Questions

- None blocking. The three reconciliation decisions (rich model, PT rename, all-four-layers) are confirmed and recorded in the `sales-module-scope` memory. Payment-channel/forma expansion and a web PDV are explicitly deferred (Non-Goals).
