## ADDED Requirements

### Requirement: Backend OpenAPI document

The system SHALL configure the NestJS backend to produce an OpenAPI (Swagger) document describing its HTTP API.

#### Scenario: OpenAPI generated

- **WHEN** the backend starts
- **THEN** an OpenAPI document for the backend's routes is available

### Requirement: Scalar/Swagger documentation UI

The system SHALL expose the API documentation through a Scalar/Swagger UI served by the backend.

#### Scenario: Docs endpoint reachable

- **WHEN** a developer opens the backend documentation endpoint
- **THEN** an interactive Scalar/Swagger UI rendering the OpenAPI document is shown
