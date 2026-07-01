## ADDED Requirements

### Requirement: Technical wrappers behind interfaces

The system SHALL provide generic technical wrappers in `lib/core/` — an HTTP client, a logger, secure storage, and a clock — each exposed through an interface with a concrete implementation, with no feature/business knowledge.

#### Scenario: Wrappers exist and are abstracted

- **WHEN** `lib/core/` is inspected
- **THEN** HTTP, logger, secure storage, and clock are each defined as an interface (`[name].dart`) plus an implementation (`[name]_impl.dart`) and contain no business context

### Requirement: HTTP client configured for the backend base URL

The system SHALL configure the HTTP client with a base URL pointing at the `@repo/backend` API and support attaching an auth token to requests.

#### Scenario: Base URL configurable

- **WHEN** the app is configured with an `API_BASE_URL`
- **THEN** the HTTP client issues requests against that base URL and can include a bearer token

### Requirement: Technical Exception hierarchy

The system SHALL define a technical Exception hierarchy in `core/` (or `data/`) that data sources throw on infrastructure failures.

#### Scenario: Exceptions thrown by infrastructure

- **WHEN** an HTTP/storage operation fails at the data-source level
- **THEN** a technical Exception (not a domain Failure) is thrown
