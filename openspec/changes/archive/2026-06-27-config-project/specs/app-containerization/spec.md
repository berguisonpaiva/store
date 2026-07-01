## ADDED Requirements

### Requirement: Per-app Dockerfile

The system SHALL generate a Dockerfile for each app (`apps/web` and `apps/backend`) capable of building and running that app independently using the detected package manager.

#### Scenario: Frontend Dockerfile

- **WHEN** the bootstrap completes
- **THEN** `apps/web` contains a Dockerfile that builds and runs the Next.js app

#### Scenario: Backend Dockerfile

- **WHEN** the bootstrap completes
- **THEN** `apps/backend` contains a Dockerfile that builds and runs the NestJS Fastify app

### Requirement: Compose wiring for local orchestration

The system SHALL provide Docker Compose wiring that can start the frontend and backend together for local development.

#### Scenario: Compose brings up apps

- **WHEN** the generated Docker Compose configuration is started
- **THEN** the frontend and backend services start and are reachable on their configured ports
