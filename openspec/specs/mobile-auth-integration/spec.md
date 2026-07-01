# mobile-auth-integration Specification

## Purpose

Integrate authentication into the Flutter app at the contract and data level: a domain auth contract, a data-layer repository implementation against the backend `/api/auth` endpoints, and token handling — without business login screens.
## Requirements
### Requirement: Auth contract in domain

The system SHALL define an authentication contract in `lib/domain/` (repository interface + entities/value objects + Failures) describing login, refresh, logout, and profile retrieval, free of Flutter and infrastructure details.

#### Scenario: Domain auth contract present

- **WHEN** `lib/domain/` is inspected
- **THEN** an auth repository interface and related entities/Failures exist with no imports of Flutter, `data`, or `core`

#### Scenario: Either-based results

- **WHEN** an auth use case or repository method is declared
- **THEN** it returns an fpdart `Either<Failure, T>` (or `Stream` thereof) rather than throwing for business outcomes

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

