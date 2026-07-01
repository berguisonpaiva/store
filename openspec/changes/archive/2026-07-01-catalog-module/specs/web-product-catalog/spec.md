## ADDED Requirements

### Requirement: ADMIN-only catalog access

The system SHALL restrict the catalog management UI to ADMIN. The `/products` pages MUST verify the session role on load and redirect a non-ADMIN session to the main page (`/dashboard`) before rendering, and the sidebar catalog entries MUST be gated to ADMIN (RN07). This UI gating is reinforcement over the authoritative backend `@Roles('ADMIN')`.

#### Scenario: ADMIN reaches products

- **WHEN** an authenticated ADMIN opens `/products`
- **THEN** the products list renders

#### Scenario: Non-ADMIN redirected

- **WHEN** an authenticated OPERADOR navigates directly to `/products` (or `/products/new`, `/products/:id`)
- **THEN** they are redirected to `/dashboard` and no product management UI is shown

#### Scenario: Inactive category surfaced on submit

- **WHEN** the backend returns 422 (`CATEGORY_INACTIVE`) or 404 (`CATEGORY_NOT_FOUND`) on product create/edit
- **THEN** the error is surfaced (field-level on the category selector when identifiable, otherwise a toast) and the user stays on the form (RN02/RN03)
