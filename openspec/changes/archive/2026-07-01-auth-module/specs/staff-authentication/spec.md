## MODIFIED Requirements

### Requirement: Authenticate staff by email and password

The system SHALL authenticate a staff user by email and password, returning an access token, a refresh token, and the authenticated user identity `{ id, name, role }` when the credentials are valid. Authentication MUST validate the password against the stored `User` hash via the `HashComparer` port and load the user through the user read port (find by email). The logic MUST be pure domain code in `modules/auth` with no HTTP or framework dependencies.

#### Scenario: Successful login

- **WHEN** a login is requested with an email that matches an active user and a password that matches the stored hash
- **THEN** the use case returns a success `Result` containing an access token, a refresh token (generated via `TokenService`), and the user identity `{ id, name, role }` (RF-AUTH-01)

#### Scenario: Inactive user cannot authenticate

- **WHEN** a login is requested for a user whose active flag is false, even with correct credentials
- **THEN** the use case returns a failed `Result` with `UserInactive` and no tokens are issued (RN02)

## ADDED Requirements

### Requirement: Get current user identity

The system SHALL expose a `GetCurrentUser` read path that, given the authenticated user id from the session context, returns that user as `{ id, name, email, role, status }` for the `GET /auth/me` presentation endpoint, reusing the existing find-user-by-id read; it MUST never include the password hash (RN08).

#### Scenario: Current user resolved

- **WHEN** the authenticated user id is resolved and passed to the read path
- **THEN** it returns `{ id, name, email, role, status }` for that user with no password hash

#### Scenario: Missing current user

- **WHEN** the authenticated user id no longer maps to an existing user
- **THEN** the read path returns a failed `Result` with `UserNotFound`
