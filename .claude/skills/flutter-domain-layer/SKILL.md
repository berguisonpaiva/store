---
name: flutter-domain-layer
description: Use this skill whenever creating, changing, or reviewing Flutter `lib/domain` code: entities, value objects, use cases, repository contracts, policies, services, Failures, DDD contexts, Stream vs Future Either, copyWith rules, and pure business logic. Trigger this skill for any request mentioning domain, business rules, use cases, entities, value objects, repositories, failures, or DDD in Flutter.
---

# Flutter Domain Layer

Use this skill to model the business core of a Flutter app without leaking framework, persistence, UI, or routing details.

## Bundled Resources

- Read `references/domain-checklist.md` before implementing or reviewing domain code.
- Read `references/source-map.md` when you need to trace which `.claude` rules informed this skill.
- Use `agents/domain-specialist.md` when delegating domain modeling or use-case review.

## Responsibility

`domain/` owns:

- Business rules.
- Entities.
- Value Objects.
- Use Cases.
- Repository contracts.
- Domain Services and Policies.
- Failures.

Suggested structure:

```text
domain/
  errors/
    failure.dart
    unexpected_failure.dart
    validation_failure.dart
  [context]/
    entities/
    value_objects/
    repositories/
    services/
    use_cases/
    errors/
  shared/
```

## Dependency Rules

The domain layer:

- Does not import Flutter.
- Does not know `data`, `core`, `ui`, or `app`.
- Defines contracts that outer layers implement.
- Is testable with plain Dart tests.

If a use case needs a technical abstraction such as a clock or app info service, place the interface in `domain/shared/` and the concrete implementation in `core/`. This keeps the port owned by the inner layer while still using a core adapter.

## Entities

Use entities for business concepts, not database rows.

Rules:

- Model behavior and invariants inside entities or value objects.
- Do not expose DTO/database details.
- Use clear names with the `Entity` suffix when that is the local project convention.
- If an entity can be edited, give it a `copyWith` with every field optional. Edit forms should update an existing entity through `existing.copyWith(...)` so invariant fields such as id, createdAt, ownerId, or parentId are not manually reconstructed.

## Value Objects

Use value objects instead of raw primitives when a value has:

- Validation.
- Formatting rules.
- Business meaning.
- Equality semantics.
- Reuse across entities/use cases.

Examples:

- Email, Money, PetWeight, VaccinationDate, NonEmptyName, Percentage.

Avoid value objects for primitives with no rule or meaning beyond display.

## Use Cases

Create a use case when:

- There is real business logic.
- More than one repository/service is orchestrated.
- The flow is reused by more than one screen.
- The behavior needs isolated tests.
- The action has a clear business name.

Do not create a use case that only forwards one repository call with no rule, orchestration, or reuse. In that case, keep the repository call direct in the ViewModel or introduce a use case only if the project consistently requires that boundary.

Naming:

```text
CreateItemUseCase
UpdateItemUseCase
DeleteItemUseCase
WatchItemsUseCase
CalculateTotalUseCase
```

## Repository Contracts

Repository interfaces live in domain:

```text
domain/[context]/repositories/[context]_repository.dart
```

Implementations live in data:

```text
data/[context]/[context]_repository_impl.dart
```

The contract exposes entities, value objects, params, and Failures. It never exposes DTOs, DAOs, table rows, QueryRow, HTTP responses, or SDK classes.

## Future Either vs Stream

Use `Future<Either<Failure, T>>` for one-shot operations:

- Create.
- Update.
- Delete.
- Fetch once.
- Submit command.

Use `Stream<T>` for reactive data:

- Lists that update from local database.
- Detail screens that refresh when related rows change.
- Timeline/watch flows.

Do not use `Stream<Either<Failure, T>>` by default. It combines two error channels and forces the ViewModel to unwrap every emission. Prefer stream native `onError` for reactive flows.

Example:

```dart
Future<Either<Failure, Item>> create(CreateItemParams params);
Stream<List<Item>> watchItems();
```

When a ViewModel subscribes to a stream, cancel the subscription in `close()`:

```dart
StreamSubscription<List<Item>>? _subscription;

@override
Future<void> close() async {
  await _subscription?.cancel();
  return super.close();
}
```

## Domain Services and Policies

Use a Domain Service or Policy when:

- The rule does not naturally belong to one entity.
- Multiple entities participate in a decision.
- The code expresses a business decision, not infrastructure.

Examples:

- `SubscriptionPolicy`.
- `AccessPolicy`.
- `PricingService`.
- `MedicationSchedulePolicy`.

## DDD Contexts

Organize domain by business context:

```text
domain/
  pet/
  vaccination/
  medication/
  subscription/
```

Create a context when it has its own:

- Language.
- Entities.
- Lifecycle.
- Rules.
- Use cases.

Context dependencies are allowed only when they represent real business dependencies. Avoid circular dependencies and artificial coupling.

## Testing

Domain tests use plain Dart:

- Fake repositories by implementing domain contracts.
- Test entity/value object validation.
- Test use case success and failure branches.
- Test stream cancellation behavior in ViewModels, not in domain unless domain owns stream composition.

## Review Checklist

- No Flutter imports.
- No `data`, `core`, `ui`, or `app` imports.
- Repository files are contracts only.
- Failures represent meaningful domain/app errors.
- One-shot operations return `Future<Either<Failure, T>>`.
- Reactive operations return `Stream<T>`.
- Editable entities have full optional `copyWith`.
- Use cases have business intent and are not empty pass-throughs.
