# web-category-management Specification

## Purpose
TBD - created by archiving change catalog-web. Update Purpose after archive.
## Requirements
### Requirement: Categories list and form

The system SHALL provide a `/categories` route (private) listing categories and a create/edit form (React Hook Form) with a required, unique name, submitting via a Server Action.

#### Scenario: Create category

- **WHEN** a unique name is submitted
- **THEN** the Server Action calls `POST /api/categories` and the list updates with a success toast (RF-CAT-09)

#### Scenario: Duplicate name surfaced

- **WHEN** the backend returns 409 (`CATEGORY_NAME_ALREADY_IN_USE`)
- **THEN** a field-level error is shown on the name input

### Requirement: Activate and deactivate categories (no delete)

The system SHALL allow activating/deactivating categories from the UI and SHALL NOT offer deletion.

#### Scenario: Toggle active

- **WHEN** the user activates/deactivates a category
- **THEN** a Server Action calls the corresponding endpoint and the list reflects the new status

### Requirement: Navigation registration

The system SHALL register “Produtos” and “Categorias” entries in the `(private)` shell navigation.

#### Scenario: Menu shows catalog entries

- **WHEN** an authenticated user views the private shell
- **THEN** the sidebar shows “Produtos” (`/products`) and “Categorias” (`/categories`)

