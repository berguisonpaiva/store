## MODIFIED Requirements

### Requirement: Category repository and query adapters

The system SHALL implement `CategoriesRepository` (`create/update/findById/findByName`) and `CategoriesQuery` as Prisma adapters mapping to/from the domain `Category`, returning `Result`, and mapping the unique-name constraint violation back to `CATEGORY_ALREADY_EXISTS`.

#### Scenario: Round-trip

- **WHEN** a category is saved and reloaded by id or name
- **THEN** the adapter reconstructs an equivalent `Category`

### Requirement: Category endpoints

The system SHALL expose role-protected (`@Roles('ADMIN')`) endpoints to create, edit, activate/deactivate, and list categories, delegating to the domain use cases. There is no delete endpoint.

#### Scenario: Create category

- **WHEN** an ADMIN POSTs a unique category name to `POST /api/categories`
- **THEN** the response is 201 with the created category (RF-CAT-09)

#### Scenario: Duplicate name mapped to 409

- **WHEN** a create/edit returns `CATEGORY_ALREADY_EXISTS`
- **THEN** the endpoint responds 409 Conflict

#### Scenario: List categories

- **WHEN** `GET /api/categories` is called
- **THEN** the categories are returned (for product-form selection and management)
