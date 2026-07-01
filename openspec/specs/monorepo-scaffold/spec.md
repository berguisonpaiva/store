# monorepo-scaffold Specification

## Purpose

Define the TurboRepo monorepo structure scaffolded and reconciled at the repository root, including the Next.js frontend app, the NestJS Fastify backend app, and the standardized Turbo build/test tasks.

## Requirements

### Requirement: TurboRepo workspace at repository root

The system SHALL initialize a TurboRepo monorepo at the repository root, including a root `package.json` with workspace configuration and a `turbo.json` pipeline. When no base exists, it SHALL scaffold one via `npx create-turbo@latest`; when a partial layout already exists, it SHALL reconcile it without overwriting existing files.

#### Scenario: Fresh repository

- **WHEN** the bootstrap runs in a directory with no `package.json` or `turbo.json`
- **THEN** a TurboRepo workspace is created with a root `package.json` declaring `apps/*` workspaces and a valid `turbo.json`

#### Scenario: Partial layout present

- **WHEN** the bootstrap runs in a directory that already contains some workspace files
- **THEN** existing files are preserved and only missing workspace files are added

### Requirement: Next.js frontend app

The system SHALL create a Next.js application at `apps/web` that builds and runs under the workspace, with no app-internal git repository.

#### Scenario: Frontend app created

- **WHEN** the bootstrap completes
- **THEN** `apps/web` contains a runnable Next.js app (with a `src/` directory) and has no nested `.git` directory

### Requirement: NestJS Fastify backend app

The system SHALL create a NestJS application using the Fastify adapter at `apps/backend` that builds and runs under the workspace, with no app-internal git repository.

#### Scenario: Backend app created

- **WHEN** the bootstrap completes
- **THEN** `apps/backend` contains a runnable NestJS app configured with the Fastify adapter and has no nested `.git` directory

### Requirement: Standardized Turbo build and test tasks

The system SHALL define `build` and `test` tasks in `turbo.json` and expose matching root scripts so that running the build/test task at the root executes the corresponding task across all apps.

#### Scenario: Root build runs all apps

- **WHEN** the root `build` task is run via Turbo
- **THEN** both `apps/web` and `apps/backend` build through the Turbo pipeline

#### Scenario: Root test runs all apps

- **WHEN** the root `test` task is run via Turbo
- **THEN** the test task is executed for every app that defines one
