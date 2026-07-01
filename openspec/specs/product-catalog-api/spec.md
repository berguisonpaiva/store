# product-catalog-api Specification

## Purpose
TBD - created by syncing change catalog-backend. Update Purpose after review.
## Requirements
### Requirement: Catalog persistence schema

The system SHALL define Prisma models `Category`, `Product`, and `Variation` (Variation 1:N under Product, optional `Product.categoryId` FK), with `active` flags and timestamps. A unique index on `Variation.sku` and a unique index on `Variation.barcode` (allowing nulls) exist only as redundant safety nets; uniqueness is enforced in the domain.

#### Scenario: Schema present

- **WHEN** `apps/backend/prisma/models/catalog.model.prisma` is inspected
- **THEN** `Category`, `Product`, and `Variation` models exist with the relations and indexes described, and no row is ever hard-deleted by the adapters

### Requirement: Product repository and query adapters

The system SHALL implement `ProductsRepository` (`create/update/findById/findBySku/findByBarcode`) and `ProductsQuery` as Prisma adapters that map Product + its Variations to/from the domain aggregate inside a transaction, return `Result`, and map unique-constraint violations back to `SKU_ALREADY_IN_USE` / `BARCODE_ALREADY_IN_USE`.

#### Scenario: Aggregate round-trip

- **WHEN** a product with variations is saved and reloaded by id, SKU, or barcode
- **THEN** the adapter reconstructs an equivalent `Product` aggregate via `toDomain`

#### Scenario: No deletion

- **WHEN** the product adapters are inspected
- **THEN** there is no hard-delete operation; deactivation updates the `active` flag

### Requirement: Product endpoints

The system SHALL expose role-protected (`@Roles('ADMIN')`) endpoints to create, edit, activate, deactivate, list (paginated, name search, category/status filters), and fetch products, delegating to the domain use cases and mapping domain failures to HTTP status codes.

#### Scenario: Create product

- **WHEN** an ADMIN POSTs a valid product with at least one variation to `POST /api/products`
- **THEN** the response is 201 with the created product (RF-CAT-01, RF-CAT-02)

#### Scenario: Duplicate SKU mapped to 409

- **WHEN** a create/edit returns `SKU_ALREADY_IN_USE`
- **THEN** the endpoint responds 409 Conflict (RF-CAT-04)

#### Scenario: Product without variation mapped to 422

- **WHEN** a create returns `PRODUCT_MUST_HAVE_VARIATION`
- **THEN** the endpoint responds 422 Unprocessable Entity (RF-CAT-02)

#### Scenario: Unknown category mapped to 404

- **WHEN** a create/edit returns `CATEGORY_NOT_FOUND`
- **THEN** the endpoint responds 404 Not Found (RN03)

#### Scenario: Inactive category mapped to 422

- **WHEN** a create/edit returns `CATEGORY_INACTIVE`
- **THEN** the endpoint responds 422 Unprocessable Entity (RN02)

#### Scenario: Invalid price mapped to 422

- **WHEN** a create/edit returns `INVALID_PRICE`
- **THEN** the endpoint responds 422 Unprocessable Entity (RN08)

#### Scenario: Paginated, filtered listing

- **WHEN** `GET /api/products?page=1&pageSize=20&name=...&categoryId=...&active=true` is called
- **THEN** a paginated payload of matching products is returned (RF-CAT-08)

### Requirement: Variation endpoints

The system SHALL expose role-protected endpoints to add a variation to a product, edit a variation, and activate/deactivate a variation, enforcing price > 0 and SKU/barcode uniqueness via the domain.

#### Scenario: Add variation

- **WHEN** an authorized user POSTs a valid variation to `POST /api/products/:productId/variations`
- **THEN** the response is 201/200 with the updated product (RF-CAT-03)

> Note: variation management routes are nested under the owning product
> (`PATCH /api/products/:productId/variations/:variationId`,
> `.../activate`, `.../deactivate`) so the aggregate root is always in the path.

#### Scenario: Invalid price rejected

- **WHEN** a variation is submitted with price ≤ 0
- **THEN** the endpoint responds 400 (RF-CAT-05)

### Requirement: PDV lookups by SKU and barcode

The system SHALL expose `GET /api/variations/by-sku/:sku` and `GET /api/variations/by-barcode/:barcode` returning the matching variation and its product, to support the PDV scan.

#### Scenario: Found by barcode

- **WHEN** `GET /api/variations/by-barcode/:barcode` matches a variation
- **THEN** the response is 200 with the variation and product context (RF-CAT-07)

#### Scenario: Not found

- **WHEN** the SKU/barcode matches nothing (`VARIATION_NOT_FOUND`)
- **THEN** the endpoint responds 404 Not Found

### Requirement: Products module wiring and documentation

The system SHALL provide a `ProductsModule` composing the domain use cases with the Prisma adapters via DI, register it in `app.module.ts`, and document every endpoint with Swagger/OpenAPI.

#### Scenario: Endpoints documented and wired

- **WHEN** the backend boots
- **THEN** the product/variation endpoints appear in the docs with auth requirements and resolve through the domain use cases (controllers contain no rules)
