## Context

The backend is NestJS on Fastify with Prisma infra, a shared error filter, and `RolesGuard` + `@Papeis` already in place (from `auth-users-backend`). `@repo/catalog` (from `catalog-domain`) defines the use cases, ports (`ProductsRepository`, `ProductsQuery`, `CategoriesRepository`, `CategoriesQuery`), and domain errors. This change makes the catalog reachable and persistent — **backend only**.

## Goals / Non-Goals

**Goals:**

- Prisma models for `Category`, `Product`, `Variation` (1:N), with unique indexes as redundant safety nets.
- Implement the catalog ports as Prisma adapters (aggregate mapping in a transaction).
- Expose role-protected REST endpoints incl. PDV SKU/barcode lookups.
- Extend the shared domain-error → HTTP mapper with catalog codes.
- Build every artifact with its skill.

**Non-Goals:**

- No web/mobile, no inventory, no domain-rule changes. No hard deletes.

## Decisions

### 1. Prerequisite + reuse

Consumes `@repo/catalog`; reuses the existing Prisma `DbModule`/`PrismaService` (transactions) and the `RolesGuard`/`@Papeis` from the shared layer. Apply `catalog-domain` first and add `@repo/catalog` to backend deps.

### 2. Variation as a child table, aggregate written transactionally

`Variation` is a 1:N child of `Product`. `ProductPrismaRepository.fromDomain` upserts the product and syncs its variations (create/update; deactivate, never delete) inside `runInTransaction`; `toDomain` rejoins them. `findBySku`/`findByBarcode` query the `Variation` table and return the owning product.

### 3. Domain decides, DB indexes are safety nets

Uniqueness (SKU, barcode-when-present, category name) is enforced by domain specifications. Unique indexes exist only as a backstop; the adapter maps `P2002` back to the matching domain code rather than leaking Prisma errors.

### 4. Authorization

Catalog management endpoints require `MASTER`/`ADMIN` via `@Papeis(MASTER, ADMIN)` + `JwtGuard`/`RolesGuard`. PDV lookups (`by-sku`/`by-barcode`) require authentication; `OPERADOR` is allowed (they operate the register) — so PDV routes use `@Papeis(MASTER, ADMIN, OPERADOR)` (i.e. any authenticated staff). Flagged in Open Questions.

### 5. Error mapping extension

Extend the shared `domain-error.mapper` with the catalog codes (404/409/400) so controllers keep translating `Result` failures uniformly.

### 6. Module layout

`apps/backend/src/modules/products/**` and `apps/backend/src/modules/categories/**` (`config-new-module` convention): module, controllers, adapters, DTOs, and a DI wiring that binds domain use cases to adapters. Controllers contain no rules.

## Skills to use

`backend-prisma-data` (models, migration, adapters), `config-shared-backend` (error-mapper extension; reuse guards), `backend-controller` (controllers, Swagger, `Result`→HTTP), `config-new-module` (module scaffolding), `verify`.

## Risks / Trade-offs

- [Variation sync (create/update/deactivate) in one transaction is non-trivial] → keep the diff in `fromDomain` explicit; cover with adapter tests.
- [Money/price storage] → store integer cents (matching the domain `Price`); validate in the HTTP DTO too (`> 0`).
- [Barcode unique index with nulls] → use a partial/filtered unique index (Postgres ignores NULLs by default in a standard unique index), so multiple null barcodes are allowed.

## Migration Plan

1. Ensure `catalog-domain` applied and `@repo/catalog` is a backend dep.
2. Add `catalog.model.prisma`; generate client + migration.
3. Implement adapters; extend the error mapper.
4. Build `ProductsModule`/`CategoriesModule`, controllers, DTOs; register in `app.module.ts`.
5. Migrate locally; verify endpoints via `/docs` (incl. PDV lookups).

Rollback: drop the migration + the two Nest modules; the domain module is untouched.

## Open Questions

- PDV lookups for `OPERADOR` (default: allowed) vs. restricted to MASTER/ADMIN?
- Should listing default to active-only unless `active` filter is provided? Default: return all, filter when provided.
