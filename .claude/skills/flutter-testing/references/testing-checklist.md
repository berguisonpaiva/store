# Testing Checklist

- Domain tests use plain Dart and fake repositories.
- Data tests cover repository/data-source behavior and Exception to Failure conversion.
- ViewModel tests cover state transitions and stream cancellation.
- Widget tests use constructor-injected ViewModels.
- `pumpApp` supplies MaterialApp, theme, localization, and feedback wrappers.
- Widget tests cover loading, empty, error, success, and interactions.
- Form tests cover create, edit, submit, loading, error, success.
- List tests cover render, tap, actions, delete confirmation.
- Tests avoid global `getIt` unless testing app composition explicitly.
