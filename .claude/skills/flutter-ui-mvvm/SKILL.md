---
name: flutter-ui-mvvm
description: Use this skill whenever creating, changing, or reviewing Flutter UI code with MVVM/Cubit: routes, views, widgets, ViewModels, states, BlocBuilder with explicit bloc, forms, create/edit flows, navigation callbacks, l10n usage, AppToast, delete confirmation, no BlocProvider, and no Flutter imports in ViewModels. Trigger for any Flutter `lib/ui` feature, screen, form, list, route wrapper, Cubit, or widget work.
---

# Flutter UI MVVM

Use this skill to build presentation code that stays testable, declarative, and separated from routing, DI, data, and business logic.

## Bundled Resources

- Read `references/ui-mvvm-checklist.md` before implementing or reviewing UI features.
- Read `references/source-map.md` when you need to trace which `.claude` rules informed this skill.
- Read `../flutter-clean-architecture/references/cqrs-pattern.md` when a ViewModel loads projections or submits commands.
- Use `agents/ui-mvvm-specialist.md` when delegating screen, ViewModel, form, or widget review.

## Responsibility

`ui/` owns:

- Routes/wrappers that host View lifecycle.
- Views.
- ViewModels/Cubits.
- States and statuses.
- Widgets.
- Theme usage.
- Shared UI components.
- Feedback and l10n applied in screens.

Suggested structure:

```text
ui/
  shared/
    theme/
    widgets/
    feedback/
    navigation/
    pages/
    l10n/
  features/
    [context]/
      [feature]/
        [feature]_route.dart
        [feature]_view.dart
        viewmodel/
          [feature]_viewmodel.dart
          [feature]_state.dart
          [feature]_status.dart
        widgets/
```

Organize `features/` by DDD context when a feature belongs to a business context. Cross-cutting features such as onboarding or settings can live flat under `features/`.

## MVVM Flow

Use this flow:

```text
Route / Wrapper -> injects dependencies and navigation callbacks
View            -> receives ViewModel and callbacks by constructor
ViewModel       -> calls use cases and emits State
State           -> represents visual state
Child widgets   -> receive only data and callbacks they need
```

Rules:

- UI may know domain.
- UI must not know data.
- ViewModels must not call repositories or queries directly; inject command/query use cases so UI does not choose data-access semantics.
- UI must not contain heavy business rules.
- UI translates Failures into localized messages.
- ViewModel does not import widgets.
- Child widgets do not receive a whole ViewModel if they only need values/callbacks.

CQRS stays behind the use-case boundary:

- Load/list/detail/watch methods call query use cases and receive read models.
- Create/update/delete methods call command use cases and submit command params/entities as defined by domain.
- State may contain read models intended for presentation, but never data DTOs, DAO rows, or concrete Query/Repository adapters.

## ViewModel/Cubit Rules

ViewModels/Cubits are presentation logic, not Flutter widgets.

They must not import:

```dart
package:flutter/material.dart
package:flutter/widgets.dart
```

If a state needs a color, icon, text style, or widget, represent it as a semantic enum/value in State and let the View convert it to UI.

Example:

```dart
enum ItemStatus { active, inactive, archived }
```

The View maps `ItemStatus` to colors/icons from the theme/design system.

Always cancel stream subscriptions in `close()`:

```dart
@override
Future<void> close() async {
  await _subscription?.cancel();
  return super.close();
}
```

## Constructor Injection

Views receive their ViewModel through the constructor.

Good:

```dart
class ExampleListView extends StatelessWidget {
  final ExampleListViewModel viewModel;

  const ExampleListView({
    required this.viewModel,
    super.key,
  });
}
```

Bad:

```dart
late final ExampleListViewModel _viewModel = getIt();
```

Only routes/wrappers should resolve dependencies through `getIt`.

## Route Lifecycle and GoRouter Rebuilds

If a Route calls `load()` or owns `close()` for a ViewModel, construct the ViewModel inside the Route State from lower-level dependencies.

Do not pass an already-created factory ViewModel through the StatefulWidget constructor if `initState()` calls `load()`. GoRouter may rebuild the widget after push/pop while reusing the old State, causing the new ViewModel to stay unloaded.

Good pattern:

```dart
class ItemDetailRoute extends StatefulWidget {
  final String itemId;
  final WatchItemUseCase watchItemUseCase;

  const ItemDetailRoute({
    required this.itemId,
    required this.watchItemUseCase,
    super.key,
  });
}

class _ItemDetailRouteState extends State<ItemDetailRoute> {
  late final ItemDetailViewModel _viewModel;

  @override
  void initState() {
    super.initState();
    _viewModel = ItemDetailViewModel(widget.watchItemUseCase);
    _viewModel.load(widget.itemId);
  }

  @override
  void dispose() {
    _viewModel.close();
    super.dispose();
  }
}
```

Receiving a ViewModel directly is safe for routes with no `load`, no subscription, and no lifecycle ownership.

## Navigation

Views do not import `app/routing` or `AppRoutes`.

Routes inject navigation callbacks:

```dart
ExampleListView(
  viewModel: getIt(),
  onItemTap: (id) => context.push(AppRoutes.itemDetailPath(id)),
);
```

Views invoke callbacks:

```dart
onTap: () => onItemTap(item.id)
```

## Bloc Usage

Use `flutter_bloc` with explicit `bloc:`. Do not use `BlocProvider`/`MultiBlocProvider` as the primary way to resolve Cubits if the project convention is constructor injection.

```dart
BlocBuilder<ExampleViewModel, ExampleState>(
  bloc: viewModel,
  builder: (context, state) => ExampleBodyWidget(
    state: state,
    onRefresh: viewModel.refresh,
  ),
);
```

Avoid `context.read/watch/select` for resolving Cubits in feature widgets.

## State Ownership

When a screen uses ViewModel/Cubit as the main state source, do not use `setState` for feature state such as:

- Loading.
- Error.
- Success.
- Filters.
- Tabs.
- Selection.
- Sorting.
- Expanded cards.

Emit changes from the ViewModel instead. `setState` is acceptable for purely local visual widgets or Routes that only host ViewModel lifecycle.

## Widgets

Rules:

- Do not create functions that return `Widget` inside a View or Widget.
- Do not define a Widget class in the same file as another Widget/View.
- Do not implement feature components inline inside `Page`, `LandingPage`, `Screen`, `View`, or `Route` files. These files should compose already-extracted widgets instead of becoming a long file with mixed responsibilities.
- Local widgets live in `ui/features/[context]/[feature]/widgets/`.
- Reusable widgets live in `ui/shared/widgets/`.
- Use one public widget class per file.
- Use `const` constructors and `super.key`.
- Prefer `SizedBox`, `ColoredBox`, or `DecoratedBox` over `Container` when only one behavior is needed.

Page/View decomposition rule:

- A page-like file (`*_page.dart`, `*_landing_page.dart`, `*_screen.dart`, `*_view.dart`) is a composition root for the visual layout of that screen.
- Any component with its own layout, conditional rendering, styling, interaction, or repeated use must be extracted to `widgets/[component_name]_widget.dart`.
- Keep only small one-line composition in the page/view file. If the code starts to need private widget helpers, nested widget classes, or large build branches, extract a widget.
- This preserves Clean Code and SOLID: each component has one reason to change, can be tested independently, and does not turn the page into a large class with multiple responsibilities.

## Forms

Use one create/edit form per feature:

```text
XFormRoute(existing: Entity?)
XFormView
XFormViewModel
```

Rules:

- Do not split `XCreateForm` and `XEditForm`.
- ViewModel receives both create and update use cases.
- `existing == null` means create.
- `existing != null` means edit.
- Initial state is prefilled from `existing`.
- Submit dispatches create or update based on `isEditing`.
- Updates use `existing.copyWith(...)`.

Use shared form widgets such as:

- `AppTextFieldWidget`
- `AppMultilineFieldWidget`
- `AppNumberFieldWidget`
- `AppDateFieldWidget`
- `AppSwitchFieldWidget`
- `AppSubmitButtonWidget`

If a wrapper does not support a needed variation, extend the wrapper before using raw `TextFormField`. Raw `TextFormField` needs a documented justification.

## Delete and Feedback

Delete flow:

```text
AppItemActionsButtonWidget -> AppConfirmDialog(destructive: true) -> delete use case -> AppToast.success/error
```

Use `AppToast` for user feedback. Avoid `SnackBar` and `ScaffoldMessenger` unless explicitly justified by the project.

## l10n

All visible strings live in localization files for every supported locale.

Rules:

- Domain does not know l10n.
- Failure does not contain translated text.
- UI maps Failure to localized text.
- No hardcoded user-facing strings in Views/Widgets.

## Review Checklist

- UI does not import data.
- ViewModel depends on use cases, not Repository/Query adapters.
- UI does not import app routing.
- View receives ViewModel and callbacks by constructor.
- ViewModel has no Flutter/Material imports.
- `BlocBuilder`/`BlocListener` use explicit `bloc:`.
- No `BlocProvider` for resolving Cubits when constructor injection is the convention.
- No functions returning widgets.
- No inline feature components inside Page/LandingPage/Screen/View files; extract to feature `widgets/`.
- Forms are unified create/edit.
- Delete is confirmed and destructive.
- Feedback uses the project wrapper.
- State is centralized in ViewModel when a ViewModel exists.
