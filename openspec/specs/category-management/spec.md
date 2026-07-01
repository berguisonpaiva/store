# category-management Specification

## Purpose
TBD - created by syncing change catalog-domain. Update Purpose after review.
## Requirements
### Requirement: Category aggregate with unique name

The system SHALL define a `Category` aggregate in `modules/catalog` with a required, unique name and an active flag. Uniqueness is decided in the domain via a repository read, never by a database constraint.

#### Scenario: Create a category

- **WHEN** a category is created with a non-empty, unused name
- **THEN** it is persisted via `CategoriesRepository` and returned (RF-CAT-09)

#### Scenario: Duplicate name rejected

- **WHEN** a category is created/edited with a name already used by another category
- **THEN** the use case returns a failed `Result` with `CategoryNameAlreadyInUse`

#### Scenario: Empty name rejected

- **WHEN** a category is created with an empty name
- **THEN** creation returns a failed `Result` with a validation error

### Requirement: Edit, activate and deactivate category

The system SHALL allow editing a category's name and activating/deactivating it. Editing a non-existent category is rejected.

#### Scenario: Edit name

- **WHEN** an existing category is renamed to a unique name
- **THEN** it is updated and returned (RF-CAT-09)

#### Scenario: Edit missing category

- **WHEN** an update targets a non-existent category id
- **THEN** the use case returns a failed `Result` with `CategoryNotFound`

#### Scenario: Activate/deactivate

- **WHEN** a category is activated or deactivated
- **THEN** its active flag is updated and it remains persisted

### Requirement: List categories

The system SHALL list categories (for selection in product forms and management).

#### Scenario: List returns categories

- **WHEN** the list categories query is issued
- **THEN** the categories are returned

### Requirement: Category ports

The system SHALL define `CategoriesRepository` (persist; reads `findById`, `findByName`) and `CategoriesQuery` (listing) as interfaces with no infrastructure in the module.

#### Scenario: Ports are interfaces only

- **WHEN** `modules/catalog` is inspected
- **THEN** `CategoriesRepository` and `CategoriesQuery` exist as contracts with no database/framework implementation
