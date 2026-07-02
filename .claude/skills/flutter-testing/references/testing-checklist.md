# Testing Checklist

- Domain tests use plain Dart, fake Repositories for commands, and fake Queries for reads.
- Query tests cover read models, empty/not-found, filtering, pagination, failures, and reactive emissions.
- Data tests cover Repository/Query/data-source behavior and Exception to Failure conversion.
- Query adapter tests assert no write side effects and no infrastructure types leak.
- ViewModel tests cover state transitions and stream cancellation.
- ViewModel tests fake use cases rather than Repository/Query adapters.
- Widget tests use constructor-injected ViewModels.
- `pumpApp` supplies MaterialApp, theme, localization, and feedback wrappers.
- Widget tests cover loading, empty, error, success, and interactions.
- Form tests cover create, edit, submit, loading, error, success.
- List tests cover render, tap, actions, delete confirmation.
- Tests avoid global `getIt` unless testing app composition explicitly.
