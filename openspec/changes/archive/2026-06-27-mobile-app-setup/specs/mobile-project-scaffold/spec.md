## ADDED Requirements

### Requirement: Flutter app at apps/mobile

The system SHALL create a Flutter application at `apps/mobile` inside the monorepo, kept outside the Turbo workspace globs so the Dart/Flutter toolchain is isolated from the Bun workspace.

#### Scenario: App created and builds

- **WHEN** the mobile setup completes
- **THEN** `apps/mobile` contains a valid Flutter project (`pubspec.yaml`, platform folders) that runs `flutter analyze` and `flutter test` without errors

#### Scenario: Not a Turbo workspace member

- **WHEN** the root workspace configuration is inspected
- **THEN** `apps/mobile` is not included in the Turbo/Bun workspace globs

### Requirement: Clean Architecture layer structure

The system SHALL organize `apps/mobile/lib/` into the layers `app/`, `core/`, `domain/`, `data/`, and `ui/` with the dependency direction pointing inward.

#### Scenario: Layers present

- **WHEN** `apps/mobile/lib/` is inspected
- **THEN** the directories `app/`, `core/`, `domain/`, `data/`, and `ui/` exist with their responsibilities scoped per the architecture

#### Scenario: Dependency direction enforced

- **WHEN** imports are analyzed
- **THEN** `domain/` imports neither Flutter nor `app`/`data`/`core`/`ui`; `ui/` does not import `data`; `data/` does not import `ui`/`app`
