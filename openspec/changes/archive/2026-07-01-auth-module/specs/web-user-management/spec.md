## ADDED Requirements

### Requirement: ADMIN-only users route with on-load guard

The system SHALL provide a `(private)` users-management route that, on load, verifies the session role is `ADMIN`; a non-`ADMIN` session MUST be redirected to the main page (`/dashboard`) before any user data is rendered (RN07). This client/server guard is defense-in-depth over the authoritative backend `RolesGuard`.

#### Scenario: ADMIN reaches the page

- **WHEN** an authenticated `ADMIN` opens the users-management route
- **THEN** the page renders the user list

#### Scenario: OPERADOR is redirected

- **WHEN** an authenticated `OPERADOR` navigates directly to the users-management route
- **THEN** they are redirected to `/dashboard` and no user list is shown

### Requirement: List and filter users

The system SHALL list staff users on the users-management page, showing `{ name, email, role, status }`, with optional filters by role and status backed by the backend `GET /api/users`.

#### Scenario: List renders

- **WHEN** an `ADMIN` opens the page
- **THEN** the current users are fetched via the authenticated API client and displayed with their role and active status, and no password hash is present in the payload (RN08)

#### Scenario: Filter by role or status

- **WHEN** the `ADMIN` selects a role and/or status filter
- **THEN** the list requests `GET /api/users` with the corresponding query params and shows only matching users

### Requirement: Create and edit user form

The system SHALL provide create and edit forms built with React Hook Form and a Zod schema (`*.schema.ts`) validated via `zodResolver`, submitting to `POST /api/users` and `PATCH /api/users/:id` respectively.

#### Scenario: Valid create

- **WHEN** the `ADMIN` submits a valid name, email, password, and role
- **THEN** the user is created via `POST /api/users` and the list refreshes to include it

#### Scenario: Inline validation

- **WHEN** a required field is empty or the email is malformed
- **THEN** an inline field error is shown and no request is sent

#### Scenario: Duplicate email surfaced

- **WHEN** the backend responds 409 (`EMAIL_ALREADY_IN_USE`)
- **THEN** a form/toast error communicates the conflict and the user stays on the form

### Requirement: Activate and deactivate actions

The system SHALL provide per-row activate and deactivate actions calling `PATCH /api/users/:id/activate` and `PATCH /api/users/:id/deactivate`.

#### Scenario: Deactivate another user

- **WHEN** the `ADMIN` deactivates a user other than themselves
- **THEN** the request succeeds and the row shows the inactive status

#### Scenario: Cannot deactivate self surfaced

- **WHEN** the backend responds 422 (`CANNOT_DEACTIVATE_SELF`)
- **THEN** an error toast explains the action is not allowed and the user remains active (RN05)
