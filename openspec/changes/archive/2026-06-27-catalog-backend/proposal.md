## Why

`catalog-domain` delivers the catalog business rules but nothing is reachable over HTTP or persisted. This change wires the `@repo/catalog` domain into the **NestJS + Fastify backend**: Prisma persistence, concrete port implementations, role-based authorization, and REST endpoints for products, variations, and categories — including the PDV barcode/SKU lookups. No web or mobile work.

## What Changes

- **Prisma models** (`backend-prisma-data`): `catalog.model.prisma` with `Category`, `Product`, and `Variation` tables (Variation 1:N under Product; SKU unique index, barcode unique-when-present index — as redundant safety nets), `active` flags, timestamps, optional `categoryId` FK.
- **Persistence adapters**: `ProductPrismaRepository` implementing `ProductsRepository` (`create/update/findById/findBySku/findByBarcode`, mapping Product+Variations, writes in a transaction), `ProductPrismaQuery` (`ProductsQuery` listing), `CategoryPrismaRepository` (`CategoriesRepository`), `CategoryPrismaQuery` — `toDomain`/`fromDomain`, returning `Result`, mapping unique-constraint violations back to domain codes.
- **Endpoints** (`backend-controller`, protected by `JwtGuard` + `RolesGuard`/`@Papeis`):
  - Products: `POST /api/products`, `PATCH /:id`, `PATCH /:id/activate`, `PATCH /:id/deactivate`, `GET /` (paginated, name search, category/status filters), `GET /:id`.
  - Variations (nested under the owning product): `POST /api/products/:productId/variations`, `PATCH /api/products/:productId/variations/:variationId`, `PATCH /api/products/:productId/variations/:variationId/activate|deactivate`.
  - PDV lookups: `GET /api/variations/by-sku/:sku`, `GET /api/variations/by-barcode/:barcode`.
  - Categories: `POST /api/categories`, `PATCH /:id`, `PATCH /:id/activate|deactivate`, `GET /` (list).
- **NestJS wiring**: `ProductsModule` and `CategoriesModule` composing the domain use cases with adapters via DI, registered in `app.module.ts`.
- **HTTP DTOs + Swagger/OpenAPI** with `class-validator` (incl. nested variation DTOs, price > 0, minStock ≥ 0).
- **Domain-error → HTTP mapping**: extend the shared mapper with `PRODUCT_NOT_FOUND`→404, `VARIATION_NOT_FOUND`→404, `CATEGORY_NOT_FOUND`→404, `SKU_ALREADY_IN_USE`→409, `BARCODE_ALREADY_IN_USE`→409, `CATEGORY_NAME_ALREADY_IN_USE`→409, `PRODUCT_MUST_HAVE_VARIATION`→400, `CATEGORY_NOT_FOUND_FOR_PRODUCT`→400.
- **Out of scope**: web/mobile, inventory module, and any change to domain rules.

## Capabilities

### New Capabilities

- `product-catalog-api`: Prisma persistence (Category/Product/Variation), product/variation adapters, the `ProductsModule`, and the REST endpoints incl. PDV SKU/barcode lookups — role-protected.
- `category-management-api`: Category persistence, the `CategoriesModule`, and the category CRUD endpoints.

### Modified Capabilities

<!-- None — backend wiring of a new domain module. -->

## Impact

- **Depends on**: `catalog-domain` applied (`@repo/catalog` a backend dependency) and the existing Prisma infra + `RolesGuard`/`@Papeis` (from `auth-users-backend`).
- **Files**: `apps/backend/prisma/models/catalog.model.prisma` (+ migration), `apps/backend/src/modules/products/**`, `apps/backend/src/modules/categories/**`, an extension to the shared domain-error mapper, and `app.module.ts`.
- **New deps**: none beyond Prisma/bcrypt already present.
- **Config**: reuses `DATABASE_URL`; no new env.
