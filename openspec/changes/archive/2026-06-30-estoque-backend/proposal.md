## Why

`estoque-domain` delivers the inventory business rules (`@repo/estoque`) but nothing is reachable over HTTP or persisted: there is no ledger table, no balance projection, and no way for `vendas` to remove stock. `estoque` is the heart of the MVP and owns `saldoAtual`, so this change wires `@repo/estoque` into the **NestJS + Fastify backend**: Prisma persistence, concrete port implementations, the `EstoquePort` for `vendas`, role-based authorization, and REST endpoints. No web or mobile work.

## What Changes

- **Prisma models** (`backend-prisma-data`): `estoque.model.prisma` with an append-only `MovimentacaoEstoque` ledger table (`tipo`, `motivo`, `quantidade`, `saldoResultante`, optional `origemVendaId`, `variacaoId` FK, `createdAt`) and a per-variation `EstoqueSaldo` balance projection (`variacaoId` unique, `saldoAtual`, `quantidadeReservada` default 0, `estoqueMinimo` seeded/denormalized from catalog `Variation.minStock`). Non-negative checks exist as redundant DB safety nets only.
- **Persistence adapters**: `EstoquePrismaRepository` implementing the domain `EstoqueRepository` with the **single-transaction write** (ledger insert + `saldoAtual` update together via `runInTransaction`, read-modify-write under a row lock for concurrency), and `EstoquePrismaQuery` implementing `EstoqueQuery` (balance, movements, below-minimum) — `toDomain`/`fromDomain`, returning `Result`.
- **`EstoquePort` implementation** consumed later by `vendas`: `darBaixa(variacaoId, qtd, origemVendaId)` / `estornar(...)` wired over the same single-transaction write (recording `SAIDA` `VENDA_*` and the compensating `ENTRADA`). No public sale-exit command.
- **Command endpoints** (`backend-controller`, `JwtGuard` + `RolesGuard`/`@Papeis`): `POST /api/inventory/entries` (registrar-entrada), `POST /api/inventory/exits` (registrar-saida), `POST /api/inventory/adjustments` (ajustar-saldo).
- **Query endpoints**: `GET /api/inventory/variations/:variacaoId/balance` (consultar-saldo → `saldoAtual` + `saldoDisponivel`), `GET /api/inventory/variations/:variacaoId/movements` (listar-movimentacoes, paginated + period filter), `GET /api/inventory/low-stock` (listar-abaixo-do-minimo).
- **NestJS wiring**: `EstoqueModule` composing the domain use cases, ports, and `EstoquePort` with the adapters via DI, registered in `app.module.ts`.
- **HTTP DTOs + Swagger/OpenAPI** with `class-validator` (`quantidade` > 0, `novoSaldo` ≥ 0, period/pagination query DTOs).
- **Domain-error → HTTP mapping**: extend the shared `domain-error.mapper` with `ESTOQUE_INSUFICIENTE`→409, `VARIACAO_NAO_ENCONTRADA`→404, `QUANTIDADE_INVALIDA`→400.
- **Out of scope**: web/mobile, the `vendas` module itself (this only implements `EstoquePort` for it), and any change to domain rules.

## Capabilities

### New Capabilities

- `inventory-movement-api`: Prisma persistence (`MovimentacaoEstoque` ledger + `EstoqueSaldo` balance projection), the persistence adapter implementing `EstoqueRepository` with the single-transaction write, the `EstoquePort` implementation (`darBaixa`/`estornar`) for `vendas`, the `EstoqueModule` DI wiring, and the role-protected command endpoints (entries/exits/adjustments). (RF-EST-01..05, RF-EST-09)
- `inventory-balance-query-api`: the `EstoqueQuery` adapter and the role-protected read endpoints — balance (`saldoAtual` + `saldoDisponivel`), movements (paginated + period filter), and below-minimum (replenishment alerts). (RF-EST-06..08)

### Modified Capabilities

<!-- None — backend wiring of a new domain module. It reads catalog's `Variation.minStock` but does not change catalog spec requirements. -->

## Impact

- **Depends on**: `estoque-domain` applied (`@repo/estoque` a backend dependency), the existing Prisma infra (`DbModule`/`PrismaService` + `runInTransaction`), the `RolesGuard`/`@Papeis` from `auth-users-backend`, and `@repo/catalog` (to read `Variation.minStock` when seeding the balance projection).
- **Files**: `apps/backend/prisma/models/estoque.model.prisma` (+ migration), `apps/backend/src/modules/inventory/**`, an extension to the shared domain-error mapper, and `app.module.ts`.
- **New deps**: none beyond Prisma already present.
- **Config**: reuses `DATABASE_URL`; no new env.
