---
name: flutter-testing
description: Use this skill whenever adding, changing, or reviewing Flutter tests: domain unit tests, data repository/data-source tests, ViewModel/Cubit tests, widget tests, flutter_test, bloc_test MockCubit, mocktail, pumpApp helpers, localization in tests, and non-flaky UI coverage. Trigger for any request mentioning tests, test strategy, widget test, Cubit test, ViewModel test, fake repositories, mocktail, bloc_test, or coverage in Flutter.
---

# Flutter Testing

Use this skill to test the right behavior at the right layer without coupling tests to implementation details.

## Bundled Resources

- Read `references/testing-checklist.md` before writing or reviewing tests.
- Read `references/source-map.md` when you need to trace which `.claude` rules informed this skill.
- Use `agents/testing-specialist.md` when delegating widget-test mapping or test-quality review.

## Test Structure

Recommended structure:

```text
test/
  domain/
  data/
  ui/
    features/
    shared/
  app/
  helpers/
```

## What to Test by Layer

Domain:

- Entity and value object validation.
- Use cases with fake repositories.
- Domain services and policies.
- Failure branches.
- No Flutter test harness needed.

Data:

- Repository implementations with fake data sources.
- Exception to Failure conversion.
- Data source behavior with fake DAOs/clients.
- Drift queries when behavior is non-trivial.
- Mapper parsing/default logic when it has rules.

ViewModel/Cubit:

- State transitions.
- Calls to use cases.
- Failure handling.
- Stream subscription behavior and cancellation.
- No Flutter widgets.

View/widget:

- Rendering states.
- User interactions.
- Navigation callback invocation.
- Dialog/toast triggers.
- Form field interaction.
- Empty/loading/error/success UI.

App/routing:

- DI/router behavior only when it has meaningful logic.

## TDD Scope

Apply TDD to:

- Domain rules.
- Use cases.
- Repository implementations.
- Data sources with behavior.
- ViewModels/Cubits.

Do not over-test:

- DTOs with only field copying.
- Mappers with no transformation.
- Pure wrappers with no logic unless they protect an integration boundary.

## Widget Test Helper

Use a centralized `pumpApp` helper so widget tests do not repeat localization/theme setup.

Example:

```dart
extension PumpAppExtension on WidgetTester {
  Future<void> pumpApp(
    Widget child, {
    ThemeData? theme,
    Locale locale = const Locale('en'),
  }) async {
    await pumpWidget(
      MaterialApp(
        theme: theme ?? ThemeData.light(),
        locale: locale,
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: ToastificationWrapper(child: child),
      ),
    );
  }
}
```

Adjust wrapper details to the project:

- Include `ToastificationWrapper` if `AppToast` depends on it.
- Include router only when testing routing behavior.
- Fix locale to keep tests deterministic.

## Widget Test Priorities

Category A - required:

- Forms with validation/submit/create-edit.
- Lists with actions, item tap, delete confirmation.
- Views with loading/loaded/error/empty states.
- Views with navigation callbacks.
- Views with `BlocListener` side effects.
- Onboarding/paywall or other high-conversion flows.

Category B - recommended:

- Informational screens with non-trivial conditional rendering.
- Shared widgets used by several features.
- Shared form wrappers.

Category C - usually unnecessary:

- Route wrappers that only resolve DI and pass dependencies.
- Pure decorative widgets.
- Prototypes likely to be replaced.

## ViewModel/Cubit Tests

Use fake use cases for deterministic state tests.

Check:

- Initial state.
- Loading transition.
- Success state.
- Failure state.
- Stream update handling.
- `close()` cancels subscriptions.

## Widget Tests with Cubits

Use `bloc_test` `MockCubit` and `mocktail`.

Pattern:

```dart
class _MockExampleViewModel extends MockCubit<ExampleState>
    implements ExampleViewModel {}

void main() {
  late _MockExampleViewModel viewModel;

  setUp(() {
    viewModel = _MockExampleViewModel();
    when(() => viewModel.state).thenReturn(const ExampleState());
  });

  testWidgets('renders empty state', (tester) async {
    when(() => viewModel.state).thenReturn(
      const ExampleState(status: ExampleStatus.empty),
    );

    await tester.pumpApp(
      ExampleView(
        viewModel: viewModel,
        onItemTap: (_) {},
      ),
    );

    expect(find.text('No items'), findsOneWidget);
  });
}
```

Rules:

- Inject ViewModel/Cubit by constructor.
- Do not touch `getIt` in widget tests.
- Do not use `BlocProvider` if the project convention is explicit `bloc:`.
- Test behavior visible to the user, not private widget structure.
- Use callbacks that capture local variables to verify navigation arguments.
- Prefer `find.text`, `find.bySemanticsLabel`, `find.byTooltip`, `find.byIcon`, and meaningful keys.
- Use `find.byType` only when there is one logical candidate.

## Pumping and Flakiness

Avoid `pumpAndSettle` when:

- There is an infinite animation.
- A toast/timer remains active.
- A loading spinner stays on screen.

Prefer:

- `await tester.pump();`
- `await tester.pump(const Duration(milliseconds: 100));`
- `await tester.scrollUntilVisible(...)` for scroll behavior.

After taps and text entry, call `pump()` to process UI updates.

## Form Coverage

Minimum form scenarios:

- Renders all fields in create mode.
- Renders prefilled values in edit mode.
- Submit calls ViewModel submit.
- Loading disables submit.
- Error state shows feedback.
- Success state triggers callback/navigation/toast as expected.

## List Coverage

Minimum list scenarios:

- Renders loading.
- Renders empty state.
- Renders list items.
- Tapping item calls navigation callback with id/entity.
- Opening item actions shows menu.
- Delete opens confirmation dialog.
- Confirm delete calls ViewModel/delete callback.

## Review Checklist

- Tests use fakes/mocks at the correct layer.
- Widget tests do not use `getIt`.
- Views are testable by constructor injection.
- Localization/theme wrappers are present.
- Tests assert user-visible behavior.
- No flaky `pumpAndSettle` usage around infinite animations/toasts.
- Domain tests do not require Flutter.
