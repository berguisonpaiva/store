---
name: flutter-code-review
description: Use this skill whenever reviewing Flutter code against Clean Architecture, DDD, CQRS, MVVM, Dart style, layer boundaries, tests, anti-patterns, design system rules, get_it, fpdart, Drift, and flutter_bloc conventions. Trigger for review, audit, CQRS validation, command/query separation, code review, PR review, or "see if this follows the architecture" in Flutter.
---

# Flutter Code Review

Use this skill to review Flutter code with a bug/risk-first stance. Lead with findings, ordered by severity, and cite file/line references.

## Bundled Resources

- Read `references/review-checklist.md` before a full code review.
- Read `references/source-map.md` when you need to trace which `.claude` rules informed this skill.
- Read `../flutter-clean-architecture/references/cqrs-pattern.md` before reviewing persisted reads/writes.
- Use `agents/reviewer-specialist.md` when delegating a strict review-only pass.

## Review Stance

Prioritize:

- Behavioral bugs.
- Layer boundary violations.
- Regression risk.
- Missing tests where behavior changed.
- Performance or lifecycle risks.
- Maintainability issues that will cause real future cost.

Do not focus on style nits unless they violate established project rules or hide a real problem.

## Required Checks

Architecture:

- Domain does not import Flutter, data, core, ui, or app.
- Data does not import UI or app.
- UI does not access data sources.
- UI does not import `app/routing` or `AppRoutes`.
- Core does not know feature-specific domain.
- App wires dependencies but does not contain heavy business rules.

CQRS:

- Repositories own create/update/delete and entity reads required by command invariants.
- Queries own details/lists/filters/pagination/joins/aggregates and return framework-free read models.
- Queries never mutate state; Repositories do not return consumer projections.
- Data DTOs, DAO rows, QueryRows, HTTP responses, and SDK types do not leak into Query contracts/read models.
- Query adapters map directly to read models when entity reconstruction is unnecessary.
- Reactive Query adapters convert technical Exceptions to Failures on the stream error channel.
- ViewModels consume command/query use cases, not Repository/Query adapters.

Failure/Exception:

- Data sources throw Exceptions.
- Repositories convert Exceptions to Failures.
- UI translates Failures into localized messages.
- Failures do not carry translated UI copy.

Use case and stream rules:

- One-shot operations use `Future<Either<Failure, T>>`.
- Reactive data uses `Stream<T>`.
- Avoid `Stream<Either<Failure, T>>` by default.
- Stream subscriptions are cancelled in `close()`.

DI:

- Manual `get_it` modules if that is the project convention.
- No `injectable` unless explicitly adopted.
- `injection.dart` only orchestrates modules.
- Use cases and ViewModels registered as factories.
- Data sources, Repository and Query implementations, DAOs, and core wrappers registered as lazy singletons.

UI/MVVM:

- ViewModels/Cubits do not import Flutter/Material/Widgets.
- Views receive ViewModels and callbacks by constructor.
- Feature state lives in ViewModel/Cubit state, not `setState`, when a ViewModel exists.
- `BlocBuilder`/`BlocListener` use explicit `bloc:` if that is the convention.
- No `BlocProvider`/`MultiBlocProvider` for resolving Cubits in that convention.
- Route that calls `load()`/`close()` constructs the ViewModel in State from dependencies, not by receiving a ready factory-created ViewModel.
- Navigation flows through callbacks.

Widgets:

- No functions returning `Widget` inside Views/Widgets.
- No Widget class defined in the same file as another Widget/View.
- No feature components implemented inline inside `Page`, `LandingPage`, `Screen`, `View`, or `Route` files.
- Page/View files should compose extracted widgets; visual sections, cards, CTA blocks, list items, form blocks, and repeated rows go in `widgets/`.
- Local widgets live in feature `widgets/`.
- Reusable widgets live in `ui/shared/widgets/`.
- Constructors use `const` and `super.key` when possible.

Data/Drift:

- DTOs, DAOs, QueryRow, and table rows do not leak outside data.
- Drift app schema stays in `data/local_database`.
- `customSelect` reactive queries list every SQL table in `readsFrom`.
- No N+1 query loops.

Design system:

- No hardcoded colors, spacing, radius, or typography in feature UI when tokens exist.
- Existing shared widgets are reused.
- Raw `TextFormField` has justification or wrapper should be extended.
- Feedback uses `AppToast` if it is the project wrapper.
- Delete uses destructive confirmation.
- User-visible strings are localized.

Style:

- Files use `snake_case`.
- Classes use `PascalCase`.
- Methods/variables use `camelCase`.
- Booleans read like questions.
- No unnecessary `Manager`, `Helper`, `Utils`.
- No abbreviations.
- No `new`.
- Class member order is fields -> constructor -> methods.
- Prefer early returns.

Tests:

- Domain rules tested without Flutter.
- Use cases tested with fake repositories.
- Command use cases tested with fake Repositories; query use cases tested with fake Queries.
- Repositories/data sources tested when behavior changed.
- ViewModels tested with fake use cases.
- Views tested with fake/mock ViewModels via constructor.
- Widget tests cover form/list/state behaviors when UI changed.

## Anti-Patterns to Flag

Flag these strongly:

- Domain importing Flutter.
- UI importing data or app routing.
- Projection reads implemented as Repository methods instead of Queries.
- Query contracts that return infrastructure DTOs/rows or perform writes.
- ViewModels injecting Repository/Query adapters directly.
- ViewModel importing Flutter/Material.
- View resolving `getIt` internally.
- Route with `load()` receiving a ready ViewModel.
- `BlocProvider` used to resolve Cubits when explicit `bloc:` is the standard.
- `context.read/watch/select` as primary Cubit resolution.
- `SnackBar`/`ScaffoldMessenger` when `AppToast` is required.
- Raw `toastification` imports outside the wrapper/setup.
- Raw `TextFormField` in Views without justification.
- Separate create/edit forms for the same entity.
- Delete without destructive confirmation.
- N+1 queries.
- Missing `readsFrom` table in Drift reactive SQL.
- Side effects in `build`.
- Large/dynamic lists with `shrinkWrap: true`.
- Widget-returning helper functions.
- Multiple public widget classes in one file.
- Large Page/LandingPage/Screen/View files that contain many components inline instead of extracting widgets.
- Magic numbers.

## Output Format

When issues exist:

```text
Findings

1. [Severity] [file:line] - [short title]
   [Clear explanation of the bug/risk and violated rule.]

Open Questions
[Only if needed.]

Summary
[Brief change summary or residual risk.]
```

When no issues are found:

```text
No blocking issues found.

Residual risk: [tests not run, areas not inspected, or remaining uncertainty].
```

Severity guide:

- Critical: likely production failure, data loss, privacy/security, crash, severe architecture break.
- High: real behavioral regression, broken UI flow, test gap on risky change, serious layer violation.
- Medium: maintainability/lifecycle issue likely to cause bugs.
- Low: convention issue with limited risk.
