# mobile-composition-root Specification

## Purpose

Define the composition root for the Flutter app: bootstrap, dependency injection with get_it, and routing with GoRouter, all wired from the `app/` layer.

## Requirements

### Requirement: Bootstrap and app entrypoint

The system SHALL provide a bootstrap flow in `lib/app/` that initializes dependencies before running the root app widget.

#### Scenario: App boots

- **WHEN** the app starts
- **THEN** bootstrap runs dependency registration and then mounts the root app widget without runtime errors

### Requirement: Dependency injection with get_it per layer

The system SHALL register dependencies using get_it organized into per-layer modules (core, data, domain, ui) wired from the composition root in `app/`.

#### Scenario: DI modules registered

- **WHEN** bootstrap completes
- **THEN** get_it resolves the registered core/data/domain/ui dependencies, and module registration order avoids unmet dependencies

### Requirement: Routing with GoRouter

The system SHALL configure navigation using GoRouter declared in the `app/` layer, with at least one initial route.

#### Scenario: Router resolves initial route

- **WHEN** the app launches
- **THEN** GoRouter renders the configured initial route
