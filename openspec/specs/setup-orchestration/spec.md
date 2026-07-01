# setup-orchestration Specification

## Purpose

Define how the bootstrap detects the project package manager, persists and reconciles setup state idempotently via `skills.config.json`, and allows configuration overrides from the CLI at invocation time.

## Requirements

### Requirement: Package manager detection

The system SHALL detect the project package manager from the `packageManager` field and/or lockfile, preferring Bun, then pnpm, then npm, and SHALL use the detected manager for every generated script and install step.

#### Scenario: Bun detected

- **WHEN** a `bun.lockb` or `packageManager: "bun@..."` is present
- **THEN** generated scripts and install commands use Bun

#### Scenario: Fallback to npm

- **WHEN** no Bun or pnpm signal is present
- **THEN** generated scripts and install commands use npm

### Requirement: Idempotent setup driven by skills.config.json

The system SHALL persist setup state/config in `skills.config.json` and SHALL be safe to re-run, reconciling existing structure instead of duplicating or overwriting it.

#### Scenario: Re-run is non-destructive

- **WHEN** the bootstrap is run a second time on an already-configured project
- **THEN** no existing files are clobbered and already-completed steps are skipped or reconciled

#### Scenario: Config records setup

- **WHEN** the bootstrap completes
- **THEN** `skills.config.json` reflects the applied setup so subsequent runs can read prior state

### Requirement: CLI override of configuration

The system SHALL allow configuration values from `skills.config.json` to be overridden via CLI input at invocation time.

#### Scenario: Override applied

- **WHEN** a configuration value is provided via CLI that differs from `skills.config.json`
- **THEN** the CLI value takes precedence for that run
