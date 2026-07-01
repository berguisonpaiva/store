## MODIFIED Requirements

### Requirement: Categories list and form

The system SHALL provide a `/categories` route (private) listing categories and a create/edit form (React Hook Form) with a required, unique name, submitting via a Server Action.

#### Scenario: Create category

- **WHEN** a unique name is submitted
- **THEN** the Server Action calls `POST /api/categories` and the list updates with a success toast (RF-CAT-09)

#### Scenario: Duplicate name surfaced

- **WHEN** the backend returns 409 (`CATEGORY_ALREADY_EXISTS`)
- **THEN** a field-level error is shown on the name input

### Requirement: Navigation registration

The system SHALL register a “Catálogo” grouping with “Produtos” (`/products`) and “Categorias” (`/categories`) entries in the `(private)` shell navigation, gated to the ADMIN role so the entries appear only for ADMIN sessions (RN07, reinforcement only).

#### Scenario: ADMIN sees catalog entries

- **WHEN** an authenticated ADMIN views the private shell
- **THEN** the sidebar shows “Produtos” (`/products`) and “Categorias” (`/categories`)

#### Scenario: Non-ADMIN does not see catalog entries

- **WHEN** an authenticated OPERADOR views the private shell
- **THEN** the sidebar does not render the “Produtos”/“Categorias” entries

## ADDED Requirements

### Requirement: ADMIN-only category route guard

The system SHALL verify the session role on load of the `/categories` route and redirect a non-ADMIN session to `/dashboard` before rendering the category management UI (RN07).

#### Scenario: Non-ADMIN redirected

- **WHEN** an authenticated OPERADOR navigates directly to `/categories`
- **THEN** they are redirected to `/dashboard` and no category management UI is shown
