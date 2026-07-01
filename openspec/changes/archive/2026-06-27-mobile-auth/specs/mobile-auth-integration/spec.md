## MODIFIED Requirements

### Requirement: Auth repository implementation against the backend

The system SHALL implement the auth contract in `lib/data/` against the backend endpoints `POST /api/auth/login` and `POST /api/auth/refresh` only (the backend exposes no `/logout` or `/profile`). The login and refresh responses carry tokens only (`accessToken`, and `refreshToken` on login); the authenticated user SHALL be derived by decoding the access-token payload (`sub`→id, `name`, `email`, and `role`). Tokens SHALL be persisted via secure storage. `signOut` SHALL clear the persisted tokens locally without a backend call.

#### Scenario: Endpoints wired

- **WHEN** the auth repository/data source is inspected
- **THEN** it targets only `/api/auth/login` and `/api/auth/refresh`, with no calls to `/logout` or `/profile`

#### Scenario: User derived from the access token

- **WHEN** a login or session restore produces an access token
- **THEN** the user (id, name, email, role) is obtained by decoding the access-token payload, not from a `user` field or a profile request

#### Scenario: Tokens persisted

- **WHEN** a login or refresh succeeds
- **THEN** the access and refresh tokens are written to secure storage

#### Scenario: Local sign-out

- **WHEN** `signOut` is called
- **THEN** the stored tokens are cleared locally and the result is a success, with no network request

#### Scenario: Exceptions converted to Failures

- **WHEN** a data source throws a technical Exception during an auth call
- **THEN** the repository implementation catches it and returns a domain `Failure` via `Either`

## REMOVED Requirements

### Requirement: No login screens yet

**Reason**: This change introduces the authentication UI (login screen, session, and guard) in the Flutter app.

**Migration**: The login/auth screens now live under `lib/ui/auth/`; see the `mobile-auth-experience` capability for the delivered behavior.
