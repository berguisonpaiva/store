## MODIFIED Requirements

### Requirement: Variation fields and price rule

The system SHALL validate each variation: SKU required, barcode optional, attributes optional key/value, price strictly greater than zero, and minStock an integer ≥ 0 (default 0). Price and minStock validation live in value objects, and a price ≤ 0 MUST surface as a failed `Result` with `InvalidPrice` (not an unhandled thrown error).

#### Scenario: Price must be greater than zero

- **WHEN** a variation is built with a price ≤ 0
- **THEN** creation returns a failed `Result` with `InvalidPrice` (RN08)

#### Scenario: minStock defaults to zero and cannot be negative

- **WHEN** a variation is built without a minStock
- **THEN** minStock is 0; and a negative minStock is rejected

### Requirement: Create and edit product

The system SHALL allow creating a product (name, optional description, optional category, initial variation(s)) and editing its name/description/category. `categoryId` is optional; but whenever a category is referenced, that category MUST exist and MUST be active (RN01/RN02/RN03).

#### Scenario: Create with optional fields

- **WHEN** a product is created with only a name and one variation (no category)
- **THEN** it is persisted via `ProductsRepository` and returned (RF-CAT-01)

#### Scenario: Unknown category rejected

- **WHEN** a product is created/edited referencing a non-existent categoryId
- **THEN** the use case returns a failed `Result` with `CategoryNotFound` (RN03)

#### Scenario: Inactive category rejected

- **WHEN** a product is created/edited referencing a categoryId whose category exists but is inactive
- **THEN** the use case returns a failed `Result` with `CategoryInactive` and nothing is persisted (RN02)

#### Scenario: Edit a missing product

- **WHEN** an update targets a non-existent product id
- **THEN** the use case returns a failed `Result` with `ProductNotFound`
