# product-catalog Specification

## Purpose
TBD - created by syncing change catalog-domain. Update Purpose after review.
## Requirements
### Requirement: Product aggregate with variations

The system SHALL define a `Product` aggregate in `modules/catalog` with name, optional description, optional categoryId, an active flag, and a non-empty list of `Variation` entities. Each `Variation` has a SKU, optional barcode, key/value attributes, a price, a minStock (default 0), and an active flag. The aggregate MUST be pure domain logic reusing shared/module value objects, and a product MUST always have at least one variation.

#### Scenario: Valid product is created with a variation

- **WHEN** a product is built with a valid name and at least one valid variation
- **THEN** the aggregate is created successfully (RF-CAT-01, RF-CAT-02)

#### Scenario: Product without a variation is rejected

- **WHEN** a product is built with an empty variation list
- **THEN** creation returns a failed `Result` with `ProductMustHaveVariation` (RF-CAT-02)

#### Scenario: Invalid name is rejected

- **WHEN** a product is built with a name shorter than 2 characters
- **THEN** creation returns a failed `Result` with a validation error

### Requirement: Variation fields and price rule

The system SHALL validate each variation: SKU required, barcode optional, attributes optional key/value, price strictly greater than zero, and minStock an integer ≥ 0 (default 0). Price and minStock validation live in value objects.

#### Scenario: Price must be greater than zero

- **WHEN** a variation is built with a price ≤ 0
- **THEN** creation returns a failed `Result` (RF-CAT-05)

#### Scenario: minStock defaults to zero and cannot be negative

- **WHEN** a variation is built without a minStock
- **THEN** minStock is 0; and a negative minStock is rejected

### Requirement: Unique SKU and barcode

The system SHALL enforce, in the domain, that SKU is unique across all variations and barcode is unique whenever present. The use cases decide uniqueness using repository reads (`findBySku`, `findByBarcode`); no database constraint is relied upon.

#### Scenario: Duplicate SKU

- **WHEN** a variation is created/edited with a SKU already used by another variation
- **THEN** the use case returns a failed `Result` with `SkuAlreadyInUse` (RF-CAT-04)

#### Scenario: Duplicate barcode

- **WHEN** a variation is created/edited with a barcode already used by another variation
- **THEN** the use case returns a failed `Result` with `BarcodeAlreadyInUse` (RF-CAT-04)

#### Scenario: Missing barcode is allowed

- **WHEN** a variation is created without a barcode
- **THEN** no barcode-uniqueness check applies and creation succeeds

### Requirement: Create and edit product

The system SHALL allow creating a product (name, optional description, optional existing category, initial variation(s)) and editing its name/description/category. A referenced category MUST exist.

#### Scenario: Create with optional fields

- **WHEN** a product is created with only a name and one variation
- **THEN** it is persisted via `ProductsRepository` and returned (RF-CAT-01)

#### Scenario: Unknown category rejected

- **WHEN** a product is created/edited referencing a non-existent categoryId
- **THEN** the use case returns a failed `Result` with `CategoryNotFoundForProduct`

#### Scenario: Edit a missing product

- **WHEN** an update targets a non-existent product id
- **THEN** the use case returns a failed `Result` with `ProductNotFound`

### Requirement: Add and edit variation

The system SHALL allow adding a variation to an existing product and editing a variation's SKU, barcode, attributes, price, and minStock, enforcing SKU/barcode uniqueness and price > 0.

#### Scenario: Add variation

- **WHEN** a valid variation is added to an existing product with a unique SKU
- **THEN** the product is updated with the new variation (RF-CAT-03)

#### Scenario: Edit missing variation

- **WHEN** editing a variation id that does not exist on the product
- **THEN** the use case returns a failed `Result` with `VariationNotFound`

### Requirement: Activate and deactivate (no deletion)

The system SHALL allow activating/deactivating products and variations and SHALL NOT provide deletion, preserving sales history.

#### Scenario: Deactivate product

- **WHEN** a product is deactivated
- **THEN** its active flag becomes false and it remains persisted (RF-CAT-06)

#### Scenario: Deactivate variation

- **WHEN** a variation is deactivated
- **THEN** its active flag becomes false and it remains persisted (RF-CAT-06)

#### Scenario: No delete use case exists

- **WHEN** `modules/catalog` is inspected
- **THEN** there is no delete-product or delete-variation use case

### Requirement: Find variation by SKU and barcode (PDV)

The system SHALL retrieve a variation by exact SKU and by exact barcode, to support the PDV barcode scan.

#### Scenario: Find by SKU

- **WHEN** a query is issued with an existing SKU
- **THEN** the matching variation (and its product) is returned (RF-CAT-07)

#### Scenario: Find by barcode not found

- **WHEN** a query is issued with a barcode that matches no variation
- **THEN** the use case returns a failed `Result` with `VariationNotFound`

### Requirement: List products

The system SHALL list products with pagination, free-text search by name, and filters by category and active status.

#### Scenario: Paginated, filtered search

- **WHEN** a list query is issued with a name term and optional category/status filters
- **THEN** a paginated result of matching products is returned (RF-CAT-08)

### Requirement: Product ports

The system SHALL define `ProductsRepository` (persist the aggregate; reads `findById`, `findBySku`, `findByBarcode`) and `ProductsQuery` (paginated listing projection) as interfaces with no infrastructure in the module.

#### Scenario: Ports are interfaces only

- **WHEN** `modules/catalog` is inspected
- **THEN** `ProductsRepository` and `ProductsQuery` exist as contracts with no database/framework implementation
