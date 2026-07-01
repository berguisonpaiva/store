## ADDED Requirements

### Requirement: Catalog contract in domain

The system SHALL define a catalog contract in `lib/domain/catalog/` — entities (`ProductEntity` with its `VariationEntity` list, `CategoryEntity`), a `CatalogRepository` interface (list products, get product, find variation by SKU, find variation by barcode, list categories), and `CatalogFailure`s — free of Flutter and infrastructure, returning fpdart `Either<Failure, T>`.

#### Scenario: Domain contract present

- **WHEN** `lib/domain/catalog/` is inspected
- **THEN** the entities, repository interface, and failures exist with no imports of Flutter, `data`, or `core`

#### Scenario: Either-based results

- **WHEN** a catalog use case or repository method is declared
- **THEN** it returns an `Either<Failure, T>` rather than throwing for business outcomes

### Requirement: Catalog repository implementation against the backend

The system SHALL implement the contract in `lib/data/catalog/` against `GET /api/products`, `GET /api/products/:id`, `GET /api/variations/by-sku/:sku`, `GET /api/variations/by-barcode/:barcode`, and `GET /api/categories`, mapping DTOs to domain and converting technical `AppException`s into `CatalogFailure`s. Requests are authenticated via the shared `HttpClient` (bearer + 401 refresh).

#### Scenario: Endpoints wired

- **WHEN** the catalog data source is inspected
- **THEN** it targets the listed endpoints and maps responses to domain entities

#### Scenario: Exceptions converted to Failures

- **WHEN** a data source throws an `AppException` during a catalog call
- **THEN** the repository returns a domain `CatalogFailure` via `Either`

### Requirement: Products list UI with search and filter

The system SHALL provide a products list screen (MVVM Cubit, explicit-bloc, no `BlocProvider`) with name search, category/status filter, and pagination, and a product detail view.

#### Scenario: Search and filter

- **WHEN** the user enters a name term or selects a category/status filter
- **THEN** the list loads the matching, paginated products from the backend (RF-CAT-08)

#### Scenario: Product detail

- **WHEN** the user opens a product
- **THEN** its variations (SKU, price, status) are shown

### Requirement: PDV variation lookup by SKU and barcode

The system SHALL provide a lookup entry that resolves a variation by SKU or barcode (the PDV bipe), showing the variation/product on success and an `AppToast` on not-found.

#### Scenario: Lookup by barcode

- **WHEN** a known barcode is entered/scanned
- **THEN** the matching variation and its product are shown (RF-CAT-07)

#### Scenario: Lookup not found

- **WHEN** the SKU/barcode matches nothing (`VariationNotFound`)
- **THEN** a not-found message is shown via `AppToast`

### Requirement: Dependency injection and routing

The system SHALL register the catalog data source, repository, use cases, and cubits in get_it, add a catalog route, and a navigation entry, behind the existing auth session.

#### Scenario: Resolvable and routed

- **WHEN** the app boots authenticated
- **THEN** the catalog cubits resolve from get_it and the catalog screen is reachable via its route

#### Scenario: ViewModels are Flutter-free

- **WHEN** the catalog ViewModels/Cubits are inspected
- **THEN** they contain no Flutter imports and delegate to use cases
