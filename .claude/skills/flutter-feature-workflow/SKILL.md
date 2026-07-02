---
name: flutter-feature-workflow
description: Use this skill whenever planning or implementing a non-trivial Flutter feature end-to-end with Clean Architecture, DDD, CQRS, MVVM, TDD, get_it modules, Drift, UI routes, designer/widget-test/reviewer handoffs, or file creation order. Trigger for requests like "implement this feature", "make a plan", "create module", "add screen with data", "commands and queries", or "build feature using domain/data/ui/app/core".
---

# Flutter Feature Workflow

Use this skill to move a feature from idea to implementation without mixing architectural decisions, coding, tests, and review responsibilities.

## Bundled Resources

- Read `references/feature-workflow-checklist.md` before planning or implementing a non-trivial feature.
- Read `references/source-map.md` when you need to trace which `.claude` rules informed this skill.
- Read `../flutter-clean-architecture/references/cqrs-pattern.md` when the feature reads or writes persisted state.
- Use `agents/feature-architect.md` for plan-only delegation and `agents/feature-developer.md` for implementation-only delegation.

## Workflow Overview

For non-trivial features:

```text
1. Plan architecture
2. Validate plan
3. Implement by layer with tests
4. Add widget tests for UI risk
5. Design review for UI
6. Code review
```

When the user explicitly asks for implementation and enough context exists, do not stop at a plan. Implement within the approved or inferred scope.

## Planning Phase

Before coding, identify:

- DDD context.
- Entities and value objects.
- Business rules and validation.
- Command Repository contracts and the entity reads required by write invariants.
- Query contracts and read models for lists, details, filters, pagination, joins, or aggregates.
- Command and query use cases.
- Return types: `Future<Either<Failure, T>>` vs `Stream<T>`.
- Local database tables/DAOs if persistence is needed.
- Data sources plus Repository and Query implementations.
- DI registrations.
- UI route/view/viewmodel/state/widgets.
- l10n keys.
- Tests.

Ask questions only when domain ambiguity would make implementation risky. For a new project or new domain, ask the domain questions first.

## Plan Output

Use this structure for feature planning:

```text
# Feature Plan - [Name]

## Context
[DDD context and reason]

## Domain
- Entities
- Value objects
- Failures
- Repository contracts
- Query contracts and read models
- Use cases with signatures

## Data
- Tables/DAOs if local
- Data sources
- Models/DTOs
- Mappers
- Repository and Query implementations

## App
- DI module registrations
- Routes and navigation callbacks

## UI
- Route/View/ViewModel/State
- Widgets
- Forms create/edit behavior
- Loading/empty/error/success states
- l10n keys

## Tests
- Domain
- Data
- ViewModel
- Widget tests

## File Order
[Exact order to create/change files]
```

## Implementation Order

Implement one layer at a time:

```text
1. domain -> tests -> entities/value objects/read models/Repository and Query contracts/use cases/failures
2. core   -> technical wrappers only if needed
3. data   -> tests -> data sources/Repository and Query impls/mappers/DTOs/Drift
4. app    -> DI and routes
5. ui     -> tests -> ViewModel/State/View/widgets/route
```

Do not move to the next layer if the current layer's tests are failing, unless the failure requires integration with the next layer and is explicitly tracked.

## TDD Defaults

Use TDD for:

- Domain rules.
- Use cases.
- Repository implementations.
- Data sources.
- ViewModels.

Usually skip tests for:

- DTOs with only copied fields.
- Mappers with no transformation.
- Route wrappers that only inject dependencies.

## Domain Rules

Keep domain pure:

- No Flutter imports.
- No data/core/ui/app imports.
- Repository and Query interfaces only.
- Repositories serve commands/entity invariants; Queries serve read projections.
- Value objects for meaningful primitives.
- Editable entities have full optional `copyWith`.

## Data Rules

Data implements domain:

- Data sources throw Exceptions.
- Repository impl catches Exceptions and returns Failures.
- Query impl maps rows/DTOs directly to read models and never mutates state.
- DTOs/DAOs do not leak.
- Drift schema in `data/local_database`.
- Use `customSelect` and `readsFrom` for reactive aggregate queries.
- Avoid N+1.

## App Rules

DI:

- Manual get_it modules.
- `injection.dart` only calls modules.
- Register core/database before contexts.
- Register use cases and ViewModels as factories.
- Register data sources/Repository and Query implementations/DAOs/core wrappers as lazy singletons.

Routing:

- Routes inject navigation callbacks.
- UI does not import app routing.
- Edit route can pass loaded entity through `state.extra`.

## UI Rules

Use MVVM:

- Route/wrapper injects dependencies and callbacks.
- View receives ViewModel by constructor.
- ViewModel calls use cases and emits State.
- Child widgets receive values/callbacks, not whole ViewModel unless justified.
- Page/LandingPage/Screen/View files compose the screen; they do not define all components inline.
- Extract visual sections, cards, CTA blocks, form blocks, list items, banners, and repeated rows into `widgets/[name]_widget.dart`.
- Keep feature-specific components in feature `widgets/`; move cross-feature components to `ui/shared/widgets/`.

For routes with `load()`/`close()`:

- Construct ViewModel in Route State from use cases/dependencies.
- Dispose/close it in `dispose()`.

Forms:

- One form for create and edit with `existing: Entity?`.
- Use shared `App*Field` wrappers.
- Submit dispatches create or update.

Feedback:

- `AppToast`, not raw `SnackBar`, if project wrapper exists.
- Deletes require destructive confirmation.

## Research Gate

Before adding a package or using unfamiliar SDK API:

- Check pub.dev and official docs.
- Confirm latest version and API.
- Decide whether the functionality is small enough to implement without dependency.
- Wrap infrastructure packages in core.

## Review Gate

Before calling the feature done:

- Run formatter/analyzer/tests appropriate to the project.
- Re-read changed files for layer violations.
- Check Page/LandingPage/Screen/View files for inline component bloat and extract widgets before finishing.
- Check l10n for every visible string.
- Check DI registrations and route wiring.
- Check stream subscriptions.
- Check UI states.
- Check design tokens/shared widgets.
