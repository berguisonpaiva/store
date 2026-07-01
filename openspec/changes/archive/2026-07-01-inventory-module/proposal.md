## Why

The inventory (`estoque`) module already exists across domain, backend, web, and mobile, but it drifted from the module's rules of record (RN): it carries a **stock-reservation concept** (`quantidadeReservada` / `saldoDisponivel`) that no use case ever writes — dead complexity where `saldoDisponivel` always equals `saldoAtual`; the **sale-driven baixa/estorno does not join the sale's transaction** (`EstoquePortService` opens its own `runInTransaction` and `EstoqueGatewayAdapter` ignores the `_tx` it receives), violating the single-transaction guarantee (RN06); and the shared **HTTP error mapper is missing three inventory codes** (`LEDGER_IMUTAVEL`, `MOTIVO_MOVIMENTACAO_INVALIDO`, `SALDO_INVALIDO`). This change reconciles the existing code to the RN rather than rebuilding it.

## What Changes

- **BREAKING (internal model): remove stock reservation.** Drop `quantidadeReservada` / `saldoDisponivel` from `EstoqueSaldo`, remove `EstoquePolicyService.assertSaldoDisponivel` (sale exits validate with `assertSaldoSuficiente` over `saldoAtual`), and drop the `quantidadeReservada` column from the `EstoqueSaldo` Prisma model (+ migration). `EstoqueGatewayAdapter.validarSaldoDisponivel` and the balance query/API/web/mobile projections compare/expose `saldoAtual` only.
- **Keep `listar-abaixo-do-minimo`**, rebased on `saldoAtual < estoqueMinimo` (already the spec's rule; only the code used the now-removed `saldoDisponivel`).
- **Honor RN06 — one transaction with the sale.** Thread the Prisma transaction context through `EstoquePort.darBaixa/estornar` → `EstoqueRepository.aplicarMovimentacao`, so a sale's stock movement commits inside the sale's ambient transaction instead of a separate one; `EstoqueGatewayAdapter` forwards the `tx` it currently drops.
- **Complete the error mapper.** Add `LEDGER_IMUTAVEL` → 409/422, `MOTIVO_MOVIMENTACAO_INVALIDO` → 400, `SALDO_INVALIDO` → 400 to `domain-error.mapper.ts`.
- **Web:** add an ADMIN-only **Estoque** sidebar entry with a page-level permission check (RN04; hiding is reinforcement), and drop the `saldoDisponivel` display from the balance screen.
- **Mobile:** keep the read-only PDV saldo consult, dropping `quantidadeReservada` / `saldoDisponivel` from `StockBalanceEntity` and the lookup view (shows `saldoAtual`).
- Confirm the domain invariants stay green: RN01 lazy zero-init, RN02 every write emits a `MovimentacaoEstoque`, RN03 motivo controlled by tipo, RN04 commands ADMIN-only, RN05 balance never negative, RN07 immutable ledger.

## Capabilities

### New Capabilities
<!-- none — this change modifies existing inventory capabilities only -->

### Modified Capabilities
- `inventory-ledger`: the single-transaction write MUST be able to run inside a caller-supplied (ambient) transaction context, not only its own.
- `inventory-balance-queries`: `consultar-saldo` returns `saldoAtual` (+ `estoqueMinimo`); the `saldoDisponivel = saldoAtual − quantidadeReservada` projection is removed.
- `inventory-sales-port`: `darBaixa`/`estornar` validate available stock as `saldoAtual` (reservation removed) and MUST record within the sale's transaction.
- `inventory-balance-query-api`: `GET .../balance` response drops `saldoDisponivel` and returns `saldoAtual` (+ `estoqueMinimo`).
- `inventory-movement-api`: `EstoqueSaldo` schema drops `quantidadeReservada`; the sale port write joins the ambient transaction; the shared error mapper gains `LEDGER_IMUTAVEL`/`MOTIVO_MOVIMENTACAO_INVALIDO`/`SALDO_INVALIDO`.
- `web-inventory-balance`: balance screen shows `saldoAtual` only; an ADMIN-only Estoque nav entry + page guard are added.
- `mobile-inventory-balance`: `StockBalanceEntity` and the saldo lookup drop `quantidadeReservada`/`saldoDisponivel`, showing `saldoAtual`.

## Impact

- **Domain** `modules/inventory/src/movimentacao`: `estoque-saldo.entity.ts`, `estoque-policy.service.ts`, `provider/estoque.port.ts` + `estoque.repository.ts` (tx param), use cases, DTOs, mocks, jest tests.
- **Backend** `apps/backend/src/modules/inventory`: `adapters/estoque.prisma.repository.ts` (ambient tx, drop reservation), `estoque.prisma.query.ts`, controllers/DTOs; `prisma/models/*.model.prisma` + migration (drop column); `shared/errors/domain-error.mapper.ts`.
- **Sales** `apps/backend/src/modules/sales/adapters/estoque.gateway.adapter.ts`: validate/forward with `saldoAtual` and pass `tx` into the port; `modules/sales` `EstoqueGateway` contract if the signature changes.
- **Web** `apps/web`: sidebar/nav config + private shell guard, `(private)/inventory/**` pages, form/read schemas.
- **Mobile** `apps/mobile`: `lib/domain/estoque` entity + `lib/data/estoque` mapper + saldo lookup view; widget/integration tests.
