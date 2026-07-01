## Why

The store needs a product catalog — products with variations (SKU, barcode, attributes, price) and categories — before sales, inventory, or PDV can work. This change delivers the **business rules only** (domain module under `modules/*`), with no backend, web, or mobile wiring. It establishes the contracts (entities, value objects, use cases, ports, domain errors) that the API and clients will consume, and that the inventory module will read (`minStock`).

## What Changes

- Add a self-contained **`catalog`** domain module with two aggregates: `product` (root, owns its `variation` entities) and `category`.
- **Product**: name, description (optional), categoryId (optional), active, and **≥1 variation**.
- **Variation** (entity within Product): SKU, barcode (optional), attributes (key/value), price, minStock (default 0, consumed by inventory), active.
- **Category**: name (unique), active.
- **Commands** (use cases): create-product, update-product, activate/deactivate-product, add-variation, update-variation, activate/deactivate-variation, create-category, update-category, activate/deactivate-category.
- **Queries**: list-products (search by name, filter by category/status, paginated), find-product-by-id, find-variation-by-sku, find-variation-by-barcode (PDV bipe), list-categories.
- **Ports**: `ProductsRepository` (+ `findBySku`, `findByBarcode` reads), `ProductsQuery`, `CategoriesRepository`, `CategoriesQuery`.
- **Invariants** (all in the domain, never the DB): a product always has ≥1 variation; SKU unique; barcode unique when present; price > 0; minStock ≥ 0; category name unique; products/variations are **deactivated, never deleted** (preserve sales history).
- **Domain errors**: `ProductNotFound`, `VariationNotFound`, `CategoryNotFound`, `SkuAlreadyInUse`, `BarcodeAlreadyInUse`, `CategoryNameAlreadyInUse`, `ProductMustHaveVariation`, `CategoryNotFoundForProduct`.
- **Out of scope**: persistence/Prisma, HTTP, guards, UI, and the inventory module itself (this only exposes `minStock`).

## Capabilities

### New Capabilities

- `product-catalog`: The `product` aggregate (with `variation` entities), its commands and queries (including find-by-SKU/barcode for PDV), `ProductsRepository`/`ProductsQuery` ports, invariants, and domain errors.
- `category-management`: The `category` aggregate, CRUD-style commands (create/update/activate/deactivate), `CategoriesRepository`/`CategoriesQuery` ports, unique-name invariant, and domain errors.

### Modified Capabilities

<!-- None — new domain module; no existing spec requirements change. -->

## Impact

- **Dirs created**: `modules/catalog/**` (`@repo/catalog`) with `src/product/**`, `src/category/**`, `src/index.ts`, and `test/**`, following the `module-aggregate` scaffold convention.
- **Reused from `packages/shared`**: `Entity`, `Result`, `UseCase`, `CrudRepository`, `PaginatedInputDTO`/`PaginatedResultDTO`, value objects (`Id`, `NonNegative`/`PositiveInteger`, `Text`/`Description`).
- **New module value objects**: `Sku`, `Barcode`, `Price` (money > 0), `VariationAttributes`, `ProductName`, `CategoryName`, `MinStock`.
- **Dependencies**: none (self-contained); consumed later by `catalog-backend` and (read-only `minStock`) by the future inventory module.
- **No runtime tech added**: pure TypeScript domain logic.
