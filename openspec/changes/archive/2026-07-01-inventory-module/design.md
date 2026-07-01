## Context

The `estoque` module is already implemented across all four layers (domain `modules/inventory/src/movimentacao`, backend `apps/backend/src/modules/inventory`, web `apps/web/(private)/inventory`, mobile `lib/domain|data/estoque`), in Portuguese, keyed by `variacaoId`, and is consumed by `sales` through the `EstoqueGateway` port. This change is a **reconciliation**, not a rebuild: the code carries features and gaps that diverge from the RN of record. Three divergences drive the work — dead stock-reservation state, a sale-driven write that escapes the sale's transaction, and an incomplete HTTP error mapper. The RN is the source of truth; existing behavior that already matches it (immutable ledger, lazy zero-init, motivo-by-tipo, ADMIN-only commands, non-negative balance, `listar-abaixo-do-minimo`) is preserved.

Reconciliation decisions were confirmed with the user and are recorded in the `inventory-module-scope` memory: remove reservation (keep `abaixo-do-minimo`), refactor to a single transaction with the sale, and keep the mobile read-only saldo consult.

## Goals / Non-Goals

**Goals:**
- Remove the unused reservation concept so the balance model is exactly `saldoAtual` + `estoqueMinimo`, with no behavior change (reservation was always 0).
- Guarantee RN06: a sale's `darBaixa`/`estornar` commits atomically **inside the sale's transaction**, never a separate one.
- Complete the shared error mapper for every `EstoqueError` code so controllers translate all domain failures.
- Keep `listar-abaixo-do-minimo`, rebased on `saldoAtual < estoqueMinimo` (already the spec rule).
- Keep the ADMIN-only web command surface (entrada/saída/ajuste) and mobile read-only consult working after the model change.

**Non-Goals:**
- Introducing a real reservation workflow (holds/carts). Reservation is removed, not reimplemented.
- Adding inventory write operations to mobile (still read-only for the MVP).
- Changing the ledger semantics (tipo/motivo enums, immutability, `saldoResultante` computation) — those already satisfy the RN.
- Renaming anything to English — this module stays Portuguese per repo convention.

## Decisions

### 1. Remove reservation instead of wiring it up
`quantidadeReservada` is never incremented by any use case, so `saldoDisponivel` is always identical to `saldoAtual`. Keeping it means carrying a column, VO checks, a policy method (`assertSaldoDisponivel`), and four projection surfaces (query/API/web/mobile) that encode a distinction that never occurs.
- **Chosen:** delete the field and collapse `assertSaldoDisponivel` into `assertSaldoSuficiente(saldoAtual, qtd)`. `EstoqueGatewayAdapter.validarSaldoDisponivel` compares against `saldoAtual`.
- **Alternative (rejected):** implement a reservation lifecycle. No requirement asks for holds; it would add concurrency surface for zero current value.
- **Alternative (rejected):** keep the column dormant. Leaves misleading API/DTO fields (`saldoDisponivel`) that imply a capability the system lacks.

### 2. Single transaction with the sale via an ambient transaction context
Today `EstoquePrismaRepository.aplicarMovimentacao` calls `this.prisma.runInTransaction(...)` unconditionally, so a sale's stock write runs in its **own** transaction; `EstoqueGatewayAdapter` even receives a `_tx` and discards it. RN06 requires the movement to be part of the sale's transaction.
- **Chosen:** thread an optional `TransactionContext`/`tx` through the port and repository. `EstoquePort.darBaixa/estornar(..., tx?)` and `EstoqueRepository.aplicarMovimentacao(mov, novoSaldo, { saldoAbsoluto?, tx? })`. When a `tx` is supplied, the repository runs the `SELECT … FOR UPDATE` + ledger insert + balance update **on that client** (joining the caller's transaction); when absent (the standalone ADMIN commands), it opens its own `runInTransaction` exactly as before. `EstoqueGatewayAdapter` forwards the `tx` it currently drops.
- **Alternative (rejected):** ambient/async-context transaction lookup with no explicit param. More magic, harder to test, and the shared `TransactionManager` already models an explicit context that the sales orchestration passes down.
- **Consequence:** the `EstoqueGateway` contract in `modules/sales` keeps its existing `tx?: TransactionContext` parameter (already present), so the sales domain is unchanged; only the estoque port signature and the adapter body change.

### 3. Error mapper completed centrally
The RN requires all `EstoqueError` codes to map to HTTP. The mapper currently covers only `ESTOQUE_INSUFICIENTE`/`VARIACAO_NAO_ENCONTRADA`/`QUANTIDADE_INVALIDA`.
- **Chosen:** add `LEDGER_IMUTAVEL` → 409 Conflict (attempt to mutate an append-only ledger is a state conflict; 422 also acceptable but 409 matches the existing `ESTOQUE_INSUFICIENTE` conflict style), `MOTIVO_MOVIMENTACAO_INVALIDO` → 400, `SALDO_INVALIDO` → 400. Also make the repository's `mapError` propagate these codes rather than rethrow.

### 4. Below-minimum keys on `saldoAtual`
The spec already defines low-stock as `saldoAtual < estoqueMinimo`; only the code used `saldoDisponivel`. Removing reservation makes code and spec coincide with no rule change.

### 5. Web ADMIN gating is defense-in-depth
The `SidebarMenuItem` type already supports `roles`. Add the Estoque item with `roles: ['ADMIN']` and a server-side permission check on the page load that redirects non-ADMIN to the main route. The backend `RolesGuard` remains authoritative; hiding/redirect is UX reinforcement (RN04).

## Risks / Trade-offs

- **Dropping the `quantidadeReservada` column is a destructive migration** → generate a forward migration that drops the column and its check constraint; there is no data to preserve (always 0). Rollback = re-add the column with default 0. Verify no adapter/query still selects it before dropping.
- **Signature change on the estoque port ripples into sales** → the `EstoqueGateway` already declares `tx?`, so the blast radius is the estoque port + one adapter; cover the joined-transaction path with an orchestration test (`vendas.orchestration.spec`) asserting rollback of the sale also rolls back the stock movement.
- **Removing `saldoDisponivel` from API/DTOs is a response-shape change** → web and mobile read models must be updated in lockstep; grep for `saldoDisponivel`/`quantidadeReservada` across all layers before considering the change done.
- **Error-mapper status choice (409 vs 422 for `LEDGER_IMUTAVEL`)** → pick 409 for consistency; document in the delta spec so it is a decision, not an accident.

## Migration Plan

1. Domain first (remove reservation, add `tx` param, keep tests green) — nothing downstream compiles against a reservation API afterwards.
2. Backend: Prisma model + drop-column migration → repository/query adapters (ambient tx, no reservation) → error mapper → controllers/DTOs → sales gateway adapter.
3. Web and mobile in parallel once the API shape is fixed.
4. Rollback: revert the migration (re-add `quantidadeReservada` default 0) and the code changes together; since reservation carried no data, rollback is safe.

## Open Questions

- None blocking. The `LEDGER_IMUTAVEL` HTTP status is fixed at 409 by decision #3; revisit only if a consumer needs 422.
