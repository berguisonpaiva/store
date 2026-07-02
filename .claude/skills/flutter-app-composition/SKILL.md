---
name: flutter-app-composition
description: Use this skill whenever creating, changing, or reviewing Flutter `lib/app` code: composition root, get_it dependency injection for Repository/Query/use-case CQRS flows, routing, GoRouter, route guards, startup/bootstrap, observers, deep links, app config, and DI module ordering. Trigger for app layer, DI, get_it, query registration, router, GoRouter, bootstrap, startup, app.dart, or route wrappers.
---

# Flutter App Composition

Use this skill to keep app-level wiring explicit, testable, and free from business logic.

## Bundled Resources

- Read `references/app-composition-checklist.md` before implementing or reviewing routing, DI, or startup.
- Read `references/source-map.md` when you need to trace which `.claude` rules informed this skill.
- Read `../flutter-clean-architecture/references/cqrs-pattern.md` when wiring a context that reads or writes persisted state.
- Use `agents/app-composition-specialist.md` when delegating DI/routing/bootstrap review.

## Responsibility

`app/` owns:

- App widget.
- Dependency injection.
- Routing.
- Route guards.
- Global observers.
- Startup/bootstrap.
- Deep links.
- Global configuration.
- Service initialization.

Suggested structure:

```text
app/
  app.dart
  config/
    app_config.dart
  di/
    injection.dart
    core_module.dart
    local_database_module.dart
    [context]_module.dart
  routing/
    app_router.dart
    app_routes.dart
    route_guards.dart
  observers/
    analytics_observer.dart
  startup/
    app_startup.dart
  deep_links/
    app_deep_link_handler.dart
```

## App Layer Rules

`app/` may know all layers because it wires them together.

But:

- It must not contain heavy business rules.
- It must not become a service locator dumping ground.
- It should decide global flow, while domain defines business decisions.
- It is the only layer that knows concrete implementations during DI registration.

## Manual get_it Dependency Injection

Use manual `get_it` modules. Do not use `injectable` or code generation unless the existing project has explicitly chosen that convention.

Recommended structure:

```text
app/di/injection.dart             calls modules only
app/di/core_module.dart           core wrappers
app/di/local_database_module.dart AppDatabase and DAOs
app/di/[context]_module.dart      data sources, repository impls, use cases, ViewModels
```

Rules:

- Declare `final getIt = GetIt.instance` once in `injection.dart`.
- Other modules import that same `getIt`.
- `injection.dart` only orchestrates modules; it should not register individual dependencies.
- Register core and database before contexts.
- Register data sources, Repository and Query implementations, and DAOs as `registerLazySingleton`.
- Register command/query use cases and ViewModels/Cubits as `registerFactory`.
- Always use lambdas: `() => ClassName(getIt())`.
- Do not use `ClassName.new`.
- Do not use `new ClassName()`.

Async dependencies:

```dart
Future<void> coreModule() async {
  final prefs = await SharedPreferences.getInstance();
  getIt.registerLazySingleton<LocalStorage>(
    () => LocalStorageImpl(prefs),
  );
}
```

Resolve async resources before registering because `registerLazySingleton` factories are synchronous.

## Context Modules

Each `[context]_module.dart` registers the whole context:

- Data sources.
- Repository implementations for commands/entity invariants.
- Query implementations for read models/projections.
- Command and query use cases.
- Domain services when needed.
- ViewModels/Cubits.

Do not split `[context]_module` and `[context]_ui_module` unless the project already has a strong reason. Keeping the context together improves traceability and makes the feature module the registration unit.

## Routing with GoRouter

Prefer a top-level `final router` when the router does not depend on dynamic state:

```dart
final router = GoRouter(
  initialLocation: AppRoutes.home,
  routes: [
    // routes
  ],
);
```

Prefer `createRouter(...)` when routing depends on:

- Auth/session state.
- `refreshListenable`.
- Remote flags.
- Observers.
- Async config.

Keep `AppRoutes` as a constants/helper namespace:

```dart
abstract final class AppRoutes {
  static const String home = '/';
  static const String itemDetail = '/items/:id';

  static String itemDetailPath(String id) => '/items/$id';
}
```

## Navigation Callbacks

UI views do not import app routing. Routes/wrappers inject callbacks.

Good:

```dart
ExampleListView(
  onItemTap: (id) => context.push(AppRoutes.itemDetailPath(id)),
);
```

For many callbacks, group them:

```dart
class ItemDetailNavigationCallbacks {
  final void Function(String id) onEdit;
  final VoidCallback onDelete;

  const ItemDetailNavigationCallbacks({
    required this.onEdit,
    required this.onDelete,
  });
}
```

Use grouped callbacks when a route/view has three or more navigation actions.

## Edit Routes and state.extra

When a list already has the entity, edit routes should receive the entity through `state.extra` to avoid redundant fetches:

```dart
GoRoute(
  path: AppRoutes.itemEdit,
  builder: (_, state) => ItemFormRoute(
    itemId: state.pathParameters['id']!,
    existing: state.extra as Item?,
  ),
);
```

The list calls:

```dart
context.push(AppRoutes.itemEditPath(item.id), extra: item);
```

Rule:

- `xEdit` routes accept `state.extra as Entity?`.
- The form route receives `existing`.
- The form handles create/edit in one implementation.

## Startup

Classify startup work:

| Blocking before first frame       | Lazy/background            |
| --------------------------------- | -------------------------- |
| Session needed for initial route  | Analytics                  |
| Critical auth state               | Ads                        |
| Local theme/locale                | Non-critical remote config |
| Critical subscription entitlement | Backup/sync                |

Keep first render fast. Heavy SDK initialization or network work should be lazy/background unless it is required for the initial route.

## Review Checklist

- `app` wires dependencies but does not contain heavy business rules.
- `getIt` exists once and is imported by modules.
- Modules register in correct order.
- Async resources are awaited before synchronous factories.
- Use cases and ViewModels are factories.
- Data sources, Repository and Query implementations, DAOs, and core wrappers are lazy singletons.
- ViewModels receive use cases, never concrete Repository/Query implementations.
- UI receives navigation callbacks; it does not import `AppRoutes`.
- Router is top-level `final` when static, factory when dynamic.
