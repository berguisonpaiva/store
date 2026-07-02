# Flutter CQRS Pattern

Use CQRS to separate models and contracts that change business state from models and contracts optimized for reading. The separation is about responsibility, not separate databases or event sourcing.

## Repository vs Query

Use a Repository for the command side:

- Create, update, delete, and persist aggregates.
- Load an entity when a command needs its current state to preserve invariants.
- Accept and return entities, value objects, command params, and `Failure`.

Use a Query for the read side:

- Fetch details, lists, filters, pagination, dashboards, joins, and aggregates.
- Return a consumer-oriented read model/projection without entity behavior.
- Read directly from Drift, an API, or another source without reconstructing an aggregate when no command invariant needs it.

Do not route a projection through a Repository merely because it reads the same table. Do not use a Query to mutate state.

## Domain Contracts

Keep both contracts framework-free and owned by the inner layer:

```text
domain/[context]/
  entities/
  repositories/
    [context]_repository.dart
  read_models/
    [context]_details_read_model.dart
  queries/
    find_[context]_details_query.dart
    watch_[context]_list_query.dart
  use_cases/
```

A read model is not a data DTO. It is a stable domain/application projection with no business behavior and no Drift, HTTP, JSON, SDK, or database types.

One-shot query:

```dart
abstract interface class FindItemDetailsQuery {
  Future<Either<Failure, ItemDetailsReadModel>> execute(String id);
}
```

Reactive query:

```dart
abstract interface class WatchItemsQuery {
  Stream<List<ItemListReadModel>> execute(ItemFilters filters);
}
```

Use `Future<Either<Failure, T>>` for one-shot reads. Use `Stream<T>` for reactive reads and the stream error channel unless the project has explicitly standardized another contract. Query adapters translate technical Exceptions into domain Failures on that error channel before the stream reaches a use case or ViewModel.

## Use Cases

- Command use cases orchestrate repositories, entities, value objects, policies, and transactions.
- Query use cases orchestrate Query contracts and return read models.
- A query use case may be thin when it stabilizes the application boundary, maps failures, combines queries, or keeps ViewModels independent from data-access contracts.
- Keep ViewModels dependent on use cases. Do not let UI choose between Repository and Query.

Suggested names:

```text
CreateItemUseCase       -> ItemRepository
UpdateItemUseCase       -> ItemRepository
DeleteItemUseCase       -> ItemRepository
FindItemDetailsUseCase  -> FindItemDetailsQuery
WatchItemsUseCase       -> WatchItemsQuery
```

## Data Adapters

Implement Repository and Query contracts separately in `data/`, even when one class or DAO supports both internally.

```text
data/[context]/
  repositories/[context]_repository_impl.dart
  queries/find_[context]_details_query_impl.dart
  queries/watch_[context]_list_query_impl.dart
```

- Repository adapters map persistence models to entities and convert technical Exceptions into Failures.
- Query adapters map rows/DTOs directly to read models and may use joins, filters, pagination, and aggregates.
- Transport/persistence DTOs remain in data and must not be exposed as read models.
- Reactive Drift Query adapters list every observed table in `readsFrom` and avoid N+1 queries.

## Dependency Injection

- Register Repository and Query implementations as lazy singletons.
- Register command and query use cases as factories.
- Register ViewModels as factories and inject use cases, never concrete data adapters.

## Testing

- Command use cases use fake repositories and assert state changes/invariants.
- Query use cases use fake queries and assert projections, empty/not-found, filtering, pagination, and failures.
- Repository adapter tests cover persistence, entity mapping, and Exception-to-Failure conversion.
- Query adapter tests cover projection mapping, joins/aggregates, reactive emissions, and Exception-to-Failure conversion on the stream error channel.
- ViewModel tests fake use cases rather than repositories or queries.

## Common Mistakes

- Returning a read DTO/projection from a Repository.
- Loading full entities for list/dashboard reads with no invariant requirement.
- Returning a data DTO, DAO row, or `QueryRow` from a domain Query.
- Putting write rules or side effects inside a Query.
- Letting ViewModels call Repository/Query adapters directly.
- Treating CQRS as a requirement for separate databases, buses, or event sourcing.
