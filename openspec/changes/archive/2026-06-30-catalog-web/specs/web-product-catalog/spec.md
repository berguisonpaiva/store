## ADDED Requirements

### Requirement: Products list with search and filters

The system SHALL provide a `/products` route (private) listing products with URL-state search by name and filters by category and status, paginated, backed by the authenticated API client.

#### Scenario: Search and filter via URL state

- **WHEN** the user types a name term or selects a category/status filter
- **THEN** the list updates and the query is reflected in the URL (`nuqs`), fetching from `GET /api/products` (RF-CAT-08)

#### Scenario: Unauthenticated access blocked

- **WHEN** an unauthenticated user requests `/products`
- **THEN** the proxy guard redirects to `/join`

### Requirement: Create and edit product with variations

The system SHALL provide a product form (React Hook Form) to create/edit a product with name, optional description, optional category, and at least one variation (SKU, optional barcode, attributes, price, minStock), submitting via a Server Action.

#### Scenario: Valid create

- **WHEN** the form is submitted with a valid name and ≥1 valid variation
- **THEN** the Server Action calls `POST /api/products`, and on success the user returns to the list with a success toast (RF-CAT-01, RF-CAT-02, RF-CAT-03)

#### Scenario: Inline validation

- **WHEN** name < 2 chars, price ≤ 0, or minStock < 0
- **THEN** inline field errors are shown and no request is sent (RF-CAT-05)

#### Scenario: Duplicate SKU/barcode surfaced

- **WHEN** the backend returns 409 (`SKU_ALREADY_IN_USE` / `BARCODE_ALREADY_IN_USE`)
- **THEN** the error is surfaced (field-level when identifiable, otherwise a toast) and the user stays on the form (RF-CAT-04)

### Requirement: Activate and deactivate from the UI (no delete)

The system SHALL allow activating/deactivating products and variations from the UI and SHALL NOT offer deletion.

#### Scenario: Toggle active

- **WHEN** the user activates or deactivates a product/variation
- **THEN** a Server Action calls the corresponding endpoint and the list reflects the new status (RF-CAT-06)

#### Scenario: No delete control

- **WHEN** the products UI is inspected
- **THEN** there is no delete action — only activate/deactivate

### Requirement: Catalog data layer

The system SHALL implement the catalog data access with server-side `apiFetch`/`apiJson` (Bearer from the session) for reads and Server Actions for mutations, mapping backend error codes to user feedback.

#### Scenario: Authenticated reads

- **WHEN** the products list/detail loads on the server
- **THEN** the request carries the session Bearer token and a 401 is treated as an auth failure
