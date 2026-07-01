## ADDED Requirements

### Requirement: Test harness and dependencies

The system SHALL configure a Flutter test harness with `flutter_test`, `bloc_test`, and `mocktail`, and provide base helpers such as a `pumpApp` widget-test helper and reusable fakes/mocks.

#### Scenario: Harness present

- **WHEN** `apps/mobile/test/` is inspected
- **THEN** test dependencies are declared and a `pumpApp` helper plus base fakes exist

### Requirement: Example tests per layer pass

The system SHALL include at least one passing example test per relevant layer (domain use case/entity, data repository, ui ViewModel/Cubit, and a widget test) demonstrating the patterns.

#### Scenario: Tests pass

- **WHEN** `flutter test` runs in `apps/mobile`
- **THEN** the example tests pass with no failures

#### Scenario: Static analysis clean

- **WHEN** `flutter analyze` runs in `apps/mobile`
- **THEN** it reports no errors
