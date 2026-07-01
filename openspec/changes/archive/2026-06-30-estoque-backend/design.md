## Context

The backend is NestJS on Fastify with Prisma infra (`DbModule`/`PrismaService` exposing `runInTransaction`/`TransactionManager`), a shared error filter + `domain-error.mapper`, and `RolesGuard` + `@Papeis` already in place (from `auth-users-backend`). `@repo/estoque` (from `estoque-domain`) defines the use cases (`registrar-entrada`, `registrar-saida`, `ajustar-saldo`, the reads, and the exposed `EstoquePort.darBaixa`/`estornar`), the ports (`EstoqueRepository`, `EstoqueQuery`), and the domain errors (`ESTOQUE_INSUFICIENTE`, `VARIACAO_NAO_ENCONTRADA`, `QUANTIDADE_INVALIDA`). `estoque` owns `saldoAtual` and is the heart of the MVP. This change makes inventory reachable and persistent — **backend only**.

## Goals / Non-Goals

**Goals:**

- Prisma models: an append-only `MovimentacaoEstoque` ledger and a per-variation `EstoqueSaldo` balance projection, with non-negative checks as redundant safety nets.
- Implement `EstoqueRepository` as a Prisma adapter with the **single-transaction write** (ledger + `saldoAtual` together) and `EstoqueQuery` for the reads.
- Implement the exposed `EstoquePort` (`darBaixa`/`estornar`) over the same transactional write, ready for `vendas`.
- Expose role-protected REST command and query endpoints under `/api/inventory`.
- Extend the shared domain-error → HTTP mapper with the estoque codes.
- Build every artifact with its skill.

**Non-Goals:**

- No web/mobile, no `vendas` module (only implement `EstoquePort` for it), no domain-rule changes. The ledger is never updated or deleted.

## Decisions

### 1. Prerequisite + reuse

Consumes `@repo/estoque`; reuses the existing Prisma `DbModule`/`PrismaService` (`runInTransaction`/`TransactionManager` — the same one `catalog-backend` used) and the `RolesGuard`/`@Papeis` from the shared layer. Reads `@repo/catalog`'s `Variation.minStock` to seed the projection. Apply `estoque-domain` first and add `@repo/estoque` to backend deps.

### 2. `MovimentacaoEstoque` is an append-only ledger; `EstoqueSaldo` is the fast-read projection

`MovimentacaoEstoque` (`tipo`, `motivo`, `quantidade`, `saldoResultante`, `origemVendaId?`, `variacaoId` FK, `createdAt`) is **insert-only** — the adapter never exposes update or delete; corrections are new movements. The balance lives in a separate `EstoqueSaldo` table keyed by `variacaoId` (unique), with `saldoAtual`, `quantidadeReservada` (default 0), and `estoqueMinimo`. This mirrors the domain split (ledger as source of truth, balance as derived read).

- Alternative considered: derive the balance by summing the ledger on each read. Rejected — too slow for the hot PDV/sale path; the projection is kept in lockstep by the single-transaction write.

### 3. `estoqueMinimo` denormalized into `EstoqueSaldo`, seeded from catalog

`estoqueMinimo` originates in catalog's `Variation.minStock` but is **denormalized into `EstoqueSaldo`** (seeded when the projection row is first created for a variation), so `listar-abaixo-do-minimo` is a single-table query and `estoque` stays the owner of its read model. Catalog remains the source for the seed value; `estoque` never writes back to catalog.

- Alternative considered: join catalog's `Variation.minStock` at query time. Rejected — couples the low-stock query to the catalog schema and adds a cross-table join on a frequent alert query.

### 4. Single-transaction write with row-locked read-modify-write

`EstoquePrismaRepository` implements the domain transactional write (e.g. `aplicarMovimentacao(mov, novoSaldo)`) inside `runInTransaction`: it (1) reads the current `EstoqueSaldo` row **under a row lock** (`SELECT ... FOR UPDATE`), (2) inserts the `MovimentacaoEstoque` with its `saldoResultante`, and (3) updates `saldoAtual` — both or neither (RF-EST-03). The row lock serializes concurrent movements on the same variation so `saldoResultante` never races. The use case computes `saldoResultante`/`novoSaldo`; the adapter only persists.

### 5. `EstoquePort` over the same write; sale exits are not public commands

The `EstoquePort` implementation (`darBaixa`/`estornar`) wired in `EstoqueModule` reuses the same single-transaction write: `darBaixa` records a `SAIDA` with motivo `VENDA_PDV`/`VENDA_ONLINE` and `origemVendaId` after the domain validates available balance (`saldoAtual − quantidadeReservada`); `estornar` records a compensating `ENTRADA` linked to the same `origemVendaId`. There is **no** controller route for sale-driven exits — the port is exposed only via DI for the future `vendas` module.

### 6. Domain decides, DB constraints are safety nets

All invariants (non-negative balance, available-balance-for-sale, `quantidade > 0`, `saldoResultante` math, variation-exists) stay in `@repo/estoque`. The DB carries only redundant backstops: a check that `saldoAtual >= 0` and `quantidadeReservada >= 0`, the `variacaoId` unique on `EstoqueSaldo`, and the FK on the ledger. The adapter does not lean on them for business behavior.

### 7. Authorization

Inventory write endpoints (entries/exits/adjustments) and reads require `JwtGuard` + `RolesGuard`. `OPERADOR` legitimately registers movements at the counter (receiving stock, recording losses) and needs balance lookups for the PDV, so command + query endpoints use `@Papeis(MASTER, ADMIN, OPERADOR)`. `ajustar-saldo` (inventory correction overriding the non-negative protection) and `low-stock` replenishment management are restricted to `@Papeis(MASTER, ADMIN)`. Flagged in Open Questions.

### 8. Error mapping extension

Extend the shared `domain-error.mapper` with `ESTOQUE_INSUFICIENTE`→409, `VARIACAO_NAO_ENCONTRADA`→404, `QUANTIDADE_INVALIDA`→400, so controllers keep translating `Result` failures uniformly.

### 9. Module layout

`apps/backend/src/modules/inventory/**` (`config-new-module` convention): `EstoqueModule`, the command/query controllers, the Prisma adapters, the `EstoquePort` provider, and the DTOs. Controllers contain no rules — they bind DTOs to use cases and translate `Result`.

## Skills to use

`backend-prisma-data` (models, migration, adapters, single-transaction write), `config-shared-backend` (error-mapper extension; reuse guards), `backend-controller` (controllers, Swagger, `Result`→HTTP), `config-new-module` (module scaffolding), `verify`.

## Risks / Trade-offs

- [Balance projection drifts from the ledger] → the single-transaction write keeps them in lockstep; `saldoResultante` lets a later job recompute/audit the balance from the ledger.
- [Concurrent movements on the same variation race on `saldoResultante`] → read-modify-write the `EstoqueSaldo` row under `SELECT ... FOR UPDATE` inside the transaction.
- [`estoqueMinimo` denormalized can drift from catalog `minStock`] → seed on projection creation; treat catalog as source for the seed; a later sync job can refresh it if needed.
- [`quantidadeReservada` has no writer yet] → reservations belong to `vendas`; the column exists (default 0) only to feed `saldoDisponivel` math.
- [Adjustment with `novoSaldo` below current can go to a low value] → only `ajustar-saldo` overrides the non-negative protection, still bounded ≥ 0 by the domain and the DB check.

## Migration Plan

1. Ensure `estoque-domain` applied and `@repo/estoque` is a backend dep.
2. Add `estoque.model.prisma` (`MovimentacaoEstoque`, `EstoqueSaldo`); generate client + migration.
3. Implement the adapters (single-transaction write, query) and the `EstoquePort` provider; extend the error mapper.
4. Build `EstoqueModule`, controllers, DTOs; register in `app.module.ts`.
5. Migrate locally; verify endpoints via `/docs`.

Rollback: drop the migration + the Nest module; the domain module is untouched.

## Open Questions

- `OPERADOR` allowed on entries/exits and balance lookups (default: yes) vs. restricted to MASTER/ADMIN?
- Should `ajustar-saldo` and `low-stock` stay MASTER/ADMIN only (default: yes)?
- Refresh `EstoqueSaldo.estoqueMinimo` from catalog on every read of the projection vs. seed-once (default: seed-once, optional later sync)?
