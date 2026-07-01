## Why

The Atos Store PDV can manage cash drawers (`caixa`), stock (`estoque`), and the catalog, but there is no way to actually **sell at the counter**. A complete counter sale has to orchestrate three things atomically: take stock down, capture the payment, and record the cash movement — all tied to the operator's open cash session. This change introduces the `vendas` aggregate as the source of truth for a PDV sale (`Venda` + `ItemVenda` + `Pagamento`) and finishes a sale in a single transaction that drives `estoque` and `caixa` through the ports they already expose.

## What Changes

- New domain aggregate `Venda` (root) + `ItemVenda` + `Pagamento` (owned by `vendas` in MVP 1), with pure business rules, money/quantity value validation, and domain errors.
- Status lifecycle `ABERTA → CONCLUIDA | CANCELADA`; a `CONCLUIDA` sale is immutable.
- Write use cases: `criar-venda`, `adicionar-item` (snapshots `precoUnitario`), `remover-item`, `aplicar-desconto`, `finalizar-venda` (single transaction), `cancelar-venda` (reverses stock + cash).
- Read use cases / queries: `buscar-venda`, `listar-vendas` (período/operador/sessão/status), `resumo-vendas` (totals).
- Provider contracts: `VendasRepository`, `VendasQuery`, and two **consumed ports** declared in `vendas`' own `provider/`: `EstoqueGateway` (validate balance, `darBaixa` with `VENDA_PDV`, `estornar` on cancel) and `CaixaGateway` (read operator's open session, register `VENDA` movement, reverse on cancel).
- **Payments live inside `vendas` for MVP 1** — there is no separate `pagamentos` module and no `PagamentoGateway`. `finalizar-venda` persists `Pagamento` rows (`forma`, `valor`) locally and enforces `Σ pagamentos = total`.
- Backend: NestJS controllers (`/vendas/*`), In/Out DTOs, Prisma persistence (`Decimal` money), an atomic DB sequence/counter for the unique `numero`, transactional `finalizar-venda`/`cancelar-venda`, and the adapters that bind `EstoqueGateway`→`estoque` and `CaixaGateway`→`caixa`.
- Web (Next.js): a PDV operation screen (not a single form) — scan/search items, edit quantity, apply discount, finalize with payment, cancel; Zod + RHF forms; API error mapping by code.
- Mobile (Flutter): domain/data/ui/app layers mirroring the same entities, use cases, `Failure` codes, and the finalize-with-payment flow.
- Invariants enforced everywhere: `total = Σ itens − desconto`; sale requires the operator's `ABERTA` cash session; `Σ pagamentos = total` to finalize; `CONCLUIDA` is immutable; cancel only before the session closes.

No breaking changes — this is additive. `vendas` only *consumes* the existing `inventory-sales-port` (`estoque`) and `cash-sales-port` (`caixa`); nothing depends on `vendas`.

## Capabilities

### New Capabilities

- `pdv-sales-management`: Domain core of the counter sale — `Venda`/`ItemVenda`/`Pagamento` entities and value objects, `precoUnitario` snapshot, subtotal/discount/total calculation, write/read use cases, the `finalizar-venda` orchestration (1→5) and `cancelar-venda` reversal via the `EstoqueGateway`/`CaixaGateway` ports declared in `provider/`, invariants, and domain error codes (`SALE_NOT_FOUND`, `SALE_ALREADY_FINALIZED`, `NO_OPEN_CASH_SESSION`, `INSUFFICIENT_STOCK`, `PAYMENT_MISMATCH`).
- `pdv-sales-api`: Backend HTTP surface (`/vendas/*`), In/Out DTOs, Prisma persistence with `Decimal` money and an atomic sequence for the unique `numero`, the `EstoqueGateway`/`CaixaGateway` adapters bound in `VendasModule`, transactional `finalizar-venda`/`cancelar-venda` with full rollback on any step failure, and error→HTTP status mapping (404/409/422).
- `web-pdv-sales`: Web PDV operation screen — single bip/SKU/name search field (`Combobox`), editable item list with snapshot price, live subtotal/discount/total, discount and payment steps, and API error handling by code.
- `mobile-pdv-sales`: Flutter (Clean Architecture / MVVM) PDV feature mirroring backend invariants, error codes, total recalculation, payment-mismatch blocking, and the read-only `CONCLUIDA` state.

### Modified Capabilities

<!-- None. `vendas` is additive and only consumes the already-defined inventory-sales-port and cash-sales-port; it changes no existing requirements. The cash-sales-port's "pending sale blocks close" scenario already anticipates a `vendas` sale in ABERTA state. -->

## Impact

- **New module**: `modules/vendas` (domain), `apps/backend/src/modules/vendas` (NestJS + Prisma), `apps/frontend/src/modules/vendas` (Next.js), Flutter `lib/{domain,data,ui,app}` PDV-sales feature.
- **Prisma schema**: new `prisma/models/vendas.model.prisma` (`Venda`, `ItemVenda`, `Pagamento`), versioned SQL migration with a unique `numero` (DB sequence/atomic counter) and FK from `ItemVenda`/`Pagamento` to `Venda`, `prisma generate`.
- **Composition root**: wire `VendasModule`; bind `EstoqueGateway` to the `estoque` `EstoquePort` and `CaixaGateway` to the `caixa` cash port.
- **Cross-module contracts (consumed)**: `vendas` → `estoque` (`darBaixa`/`estornar`, `VENDA_PDV`/`DEVOLUCAO`, `origemVendaId`) and `vendas` → `caixa` (`caixaAbertoDoOperador`, `registrarVenda`, reverse on cancel).
- **Dependency / sequencing**: requires `estoque`'s `inventory-sales-port` (done) and `caixa`'s `cash-sales-port` (defined in the in-progress `caixa-module` change) to be applied before the backend adapters can be wired. The `caixa` close-blocking invariant (`PENDING_SALE_IN_SESSION`) depends on `vendas` exposing whether a sale is still `ABERTA` in the session.
- **Shared calculation rule** kept consistent across backend/web/mobile: `total = Σ itens − desconto`, `finalizar` requires `Σ pagamentos = total`, `precoUnitario` is a snapshot captured at add-item time.
