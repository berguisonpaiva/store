## MODIFIED Requirements

### Requirement: Category aggregate with unique name

The system SHALL define a `Category` aggregate in `modules/catalog` with a required, unique name and an active flag. Uniqueness is decided in the domain via a repository read, never by a database constraint. A duplicate name MUST fail with `CategoryAlreadyExists`. The category error set MUST also include `CategoryInactive`, used when a product references an inactive category (RN02).

#### Scenario: Create a category

- **WHEN** a category is created with a non-empty, unused name
- **THEN** it is persisted via `CategoriesRepository` and returned (RF-CAT-09)

#### Scenario: Duplicate name rejected

- **WHEN** a category is created/edited with a name already used by another category
- **THEN** the use case returns a failed `Result` with `CategoryAlreadyExists`

#### Scenario: Empty name rejected

- **WHEN** a category is created with an empty name
- **THEN** creation returns a failed `Result` with a validation error
