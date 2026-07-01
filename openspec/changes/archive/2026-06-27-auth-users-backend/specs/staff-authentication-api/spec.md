## ADDED Requirements

### Requirement: Token service implementation

The system SHALL implement the domain `TokenService` port using `@nestjs/jwt`, issuing a short-lived access token and a refresh token, and validating both. Access-token validation MUST return the `AuthenticatedUser` identity; refresh validation MUST reject invalid or expired tokens.

#### Scenario: Issue access and refresh tokens

- **WHEN** a successful login produces tokens
- **THEN** `JwtTokenService` returns a short-lived access token (TTL from `JWT_ACCESS_TTL`) and a refresh token (TTL from `JWT_REFRESH_TTL`)

#### Scenario: Validate access token

- **WHEN** a valid access token is presented
- **THEN** validation returns the `AuthenticatedUser` (id, name, email)

#### Scenario: Reject invalid token

- **WHEN** a malformed or expired token is validated
- **THEN** validation fails and the caller maps it to `INVALID_TOKEN`

### Requirement: Password hashing implementations

The system SHALL implement the domain `HashGenerator` and `HashComparer` ports with bcrypt, producing a `HashPassword`-compatible hash and comparing a plain password against a stored hash.

#### Scenario: Hash and verify

- **WHEN** `HashGenerator.hash(plain)` produces a hash and `HashComparer.compare(plain, hash)` is called with the same plain text
- **THEN** the comparison returns true, and false for any other plain text

#### Scenario: Unknown-email timing safety

- **WHEN** login is attempted for an unknown email
- **THEN** the implementation performs a comparison of comparable cost (dummy hash) so response time does not reveal whether the email exists

### Requirement: Login endpoint

The system SHALL expose a public `POST /api/auth/login` accepting email and password, delegating to the `login` use case, returning access and refresh tokens on success.

#### Scenario: Successful login

- **WHEN** valid credentials for an active user are posted
- **THEN** the response is 200 with `accessToken` and `refreshToken`

#### Scenario: Invalid credentials are generic

- **WHEN** the email is unknown or the password is wrong (`INVALID_CREDENTIALS`)
- **THEN** the endpoint responds 401 with a single generic message that does not reveal whether the email exists

#### Scenario: Inactive user rejected

- **WHEN** an inactive user logs in with correct credentials (`USER_INACTIVE`)
- **THEN** the endpoint responds 403 and no tokens are issued

### Requirement: Refresh endpoint

The system SHALL expose a public `POST /api/auth/refresh` accepting a refresh token, delegating to the `refresh-token` use case, returning a new access token.

#### Scenario: Valid refresh

- **WHEN** a valid refresh token is posted
- **THEN** the response is 200 with a new `accessToken`

#### Scenario: Invalid refresh

- **WHEN** the refresh token is invalid or expired (`INVALID_TOKEN`)
- **THEN** the endpoint responds 401 Unauthorized

### Requirement: Role-based authorization guard

The system SHALL add a `RolesGuard` and a `@Papeis(...UserRole)` decorator to the backend shared layer so routes can be restricted by role, composed with the existing `JwtGuard`. A route annotated with required roles MUST reject authenticated users whose role is not allowed.

#### Scenario: Allowed role passes

- **WHEN** a user whose role is in the `@Papeis(...)` list calls a guarded route
- **THEN** the request proceeds

#### Scenario: Disallowed role blocked

- **WHEN** an authenticated user whose role is not listed calls a route guarded by `RolesGuard` + `@Papeis`
- **THEN** the response is 403 Forbidden

#### Scenario: Unauthenticated blocked

- **WHEN** a request without a valid access token hits a guarded (non-`@Public`) route
- **THEN** the response is 401 Unauthorized

### Requirement: Auth module wiring and documentation

The system SHALL provide an `AuthModule` composing the `auth` domain use cases (from `@repo/auth`) with the `TokenService`/`HashComparer` implementations and the `UserReader` read port (find-by-email) via DI, registered in `app.module.ts`, with the login/refresh endpoints documented via Swagger/OpenAPI.

#### Scenario: Auth endpoints documented and wired

- **WHEN** the backend boots
- **THEN** `/api/auth/login` and `/api/auth/refresh` are documented as public endpoints and resolve through the domain use cases (the controller contains no domain rules)
