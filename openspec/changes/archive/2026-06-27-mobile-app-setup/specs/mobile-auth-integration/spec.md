## ADDED Requirements

### Requirement: Auth contract in domain

The system SHALL define an authentication contract in `lib/domain/` (repository interface + entities/value objects + Failures) describing login, refresh, logout, and profile retrieval, free of Flutter and infrastructure details.

#### Scenario: Domain auth contract present

- **WHEN** `lib/domain/` is inspected
- **THEN** an auth repository interface and related entities/Failures exist with no imports of Flutter, `data`, or `core`

#### Scenario: Either-based results

- **WHEN** an auth use case or repository method is declared
- **THEN** it returns an fpdart `Either<Failure, T>` (or `Stream` thereof) rather than throwing for business outcomes

### Requirement: Auth repository implementation against the backend

The system SHALL implement the auth contract in `lib/data/` by calling the backend endpoints `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, and `GET /api/auth/profile`, mapping DTOs to domain and persisting tokens via secure storage.

#### Scenario: Endpoints wired

- **WHEN** the auth repository implementation is inspected
- **THEN** it targets the `/api/auth/login`, `/refresh`, `/logout`, and `/profile` endpoints and maps responses to domain entities

#### Scenario: Exceptions converted to Failures

- **WHEN** a data source throws a technical Exception during an auth call
- **THEN** the repository implementation catches it and returns a domain `Failure` via `Either`

### Requirement: No login screens yet

The system SHALL NOT include business login/auth screens in this setup; only the contract, implementation, and token handling are delivered.

#### Scenario: No auth UI

- **WHEN** `lib/ui/` is inspected
- **THEN** no login/auth feature screens are present (UI for auth is a future change)
