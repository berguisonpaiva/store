## ADDED Requirements

### Requirement: Authenticate staff by email and password

The system SHALL authenticate a staff user by email and password, returning an access token and a refresh token when the credentials are valid. Authentication MUST validate the password against the stored `User` hash via the `HashComparer` port and load the user through the user read port (find by email). The logic MUST be pure domain code in `modules/auth` with no HTTP or framework dependencies.

#### Scenario: Successful login

- **WHEN** a login is requested with an email that matches an active user and a password that matches the stored hash
- **THEN** the use case returns a success `Result` containing an access token and a refresh token generated via `TokenService` (RF-AUTH-01)

#### Scenario: Inactive user cannot authenticate

- **WHEN** a login is requested for a user whose active flag is false, even with correct credentials
- **THEN** the use case returns a failed `Result` with `UserInactive` and no tokens are issued (RF-AUTH-02)

### Requirement: Generic error on invalid credentials

The system SHALL return a single generic error for invalid credentials, without revealing whether the email exists.

#### Scenario: Unknown email

- **WHEN** a login is requested with an email that does not match any user
- **THEN** the use case returns a failed `Result` with `InvalidCredentials` (the same error used for a wrong password) (RF-AUTH-03)

#### Scenario: Wrong password

- **WHEN** a login is requested with a known email but a password that does not match the stored hash
- **THEN** the use case returns a failed `Result` with `InvalidCredentials`, identical to the unknown-email case (RF-AUTH-03)

### Requirement: Refresh access token

The system SHALL issue a new access token from a valid refresh token.

#### Scenario: Valid refresh token

- **WHEN** a refresh is requested with a refresh token that `TokenService` validates as authentic and unexpired
- **THEN** the use case returns a success `Result` containing a new access token (RF-AUTH-04)

#### Scenario: Invalid or expired refresh token

- **WHEN** a refresh is requested with a token that `TokenService` cannot validate
- **THEN** the use case returns a failed `Result` with `InvalidToken`

### Requirement: Token validation

The system SHALL provide token validation that decodes and verifies an access token via `TokenService`, returning the authenticated user identity (id, name, email) when valid, for consumption by the future presentation guard.

#### Scenario: Valid access token

- **WHEN** a valid, unexpired access token is validated
- **THEN** the validation returns the authenticated user identity

#### Scenario: Invalid access token

- **WHEN** an invalid, malformed, or expired access token is validated
- **THEN** the validation returns a failed `Result` with `InvalidToken`

### Requirement: Auth ports

The system SHALL define the ports `TokenService` (generate and validate access/refresh JWTs) and `HashComparer` (compare a plain-text password against a stored hash) as interfaces in `modules/auth`, and SHALL consume a read port over `User` (find by email) exposed by `user-management`, without implementing any concrete JWT or crypto infrastructure in the domain module.

#### Scenario: Ports are interfaces only

- **WHEN** `modules/auth` is inspected
- **THEN** `TokenService` and `HashComparer` exist as interfaces and the user read port is consumed as a contract, with no JWT library or crypto implementation in the module

### Requirement: Presentation guards are out of scope

The system SHALL NOT include the presentation guards (`JwtAuthGuard`, `RolesGuard`) or the `@Papeis` role decorator in this change; only the domain contracts and use cases that those guards will later consume are delivered.

#### Scenario: No guards in domain modules

- **WHEN** `modules/auth` and `modules/users` are inspected
- **THEN** no NestJS guard, decorator, controller, or HTTP construct is present (these belong to a future backend change)
