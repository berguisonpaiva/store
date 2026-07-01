## MODIFIED Requirements

### Requirement: Login endpoint

The system SHALL expose a public `POST /api/auth/login` accepting email and password, delegating to the `login` use case, returning access and refresh tokens plus the authenticated user `{ id, name, role }` on success.

#### Scenario: Successful login

- **WHEN** valid credentials for an active user are posted
- **THEN** the response is 200 with `accessToken`, `refreshToken`, and `user: { id, name, role }`

#### Scenario: Invalid credentials are generic

- **WHEN** the email is unknown or the password is wrong (`INVALID_CREDENTIALS`)
- **THEN** the endpoint responds 401 with a single generic message that does not reveal whether the email exists

#### Scenario: Inactive user rejected

- **WHEN** an inactive user logs in with correct credentials (`USER_INACTIVE`)
- **THEN** the endpoint responds 401 and no tokens are issued (RN02)

### Requirement: Role-based authorization guard

The system SHALL provide a `RolesGuard` and a `@Papeis(...UserRole)` decorator in the backend shared layer so routes can be restricted by role, composed with the existing `JwtGuard`. `UserRole` MUST contain only `ADMIN` and `OPERADOR`. A route annotated with required roles MUST reject authenticated users whose role is not allowed (RN07).

#### Scenario: Allowed role passes

- **WHEN** a user whose role is in the `@Papeis(...)` list calls a guarded route
- **THEN** the request proceeds

#### Scenario: Disallowed role blocked

- **WHEN** an authenticated `OPERADOR` calls a route guarded by `RolesGuard` + `@Papeis(ADMIN)`
- **THEN** the response is 403 Forbidden

#### Scenario: Unauthenticated blocked

- **WHEN** a request without a valid access token hits a guarded (non-`@Public`) route
- **THEN** the response is 401 Unauthorized (RN06)

## ADDED Requirements

### Requirement: Current user endpoint

The system SHALL expose an authenticated `GET /api/auth/me` that reads the authenticated user id via `@CurrentUser` and returns `{ id, name, email, role, status }` through the `GetCurrentUser` read path, without ever returning the password hash (RN08).

#### Scenario: Authenticated me

- **WHEN** a request with a valid access token calls `GET /api/auth/me`
- **THEN** the response is 200 with `{ id, name, email, role, status }` for the token's user

#### Scenario: Unauthenticated me

- **WHEN** `GET /api/auth/me` is called without a valid access token
- **THEN** the response is 401 Unauthorized (RN06)
