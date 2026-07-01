---
name: flutter-data-drift-layer
description: Use this skill whenever creating, changing, or reviewing Flutter `lib/data` code: repository implementations, data sources, DTOs/models, mappers, Exceptions, Drift tables, DAOs, customSelect, readsFrom, local database, remote data, and N+1 query avoidance. Trigger for any Flutter persistence, Drift, repository impl, mapper, DTO, DAO, SQL, or data-source work.
---

# Flutter Data and Drift Layer

Use this skill to implement domain contracts with infrastructure details while keeping persistence, DTOs, and SDKs out of domain and UI.

## Bundled Resources

- Read `references/data-drift-checklist.md` before implementing or reviewing data/Drift code.
- Read `references/source-map.md` when you need to trace which `.Codex` rules informed this skill.
- Use `agents/data-drift-specialist.md` when delegating persistence, repository, DAO, or SQL review.

## Responsibility

`data/` owns:

- Repository implementations.
- Local and remote data sources.
- DTOs and models.
- Mappers.
- Parsing external data.
- App-specific local persistence such as Drift tables, DAOs, migrations, and `AppDatabase`.
- Technical Exceptions related to data access.

Suggested structure:

```text
data/
  local_database/
    app_database.dart
    tables/
    daos/
  [context]/
    data_sources/
      [context]_local_data_source.dart
      [context]_local_data_source_impl.dart
      [context]_remote_data_source.dart
      [context]_remote_data_source_impl.dart
    models/
    mappers/
    [context]_repository_impl.dart
```

## Dependency Rules

`data/`:

- May know `domain`.
- May know `core`.
- Must not know `ui`.
- Must not know `app`.
- Implements domain repository contracts.

Repository relation:

```text
domain/[context]/repositories/[context]_repository.dart  contract
data/[context]/[context]_repository_impl.dart            implementation
```

The repository implementation is the boundary where technical Exceptions become domain Failures.

## Data Sources

Use data sources for technical data access:

- Local database.
- Remote API.
- Shared preferences wrapper through core.
- Files through core.
- SDK wrappers through core.

Rules:

- Data sources throw Exceptions or propagate technical errors.
- Data sources return models/DTOs or database-friendly rows, not domain Failures.
- Repository implementations convert model/DTO outputs to domain entities.
- Repository implementations catch Exceptions and return `Either<Failure, T>` when the domain contract requires it.

## Models, DTOs, and Mappers

Models/DTOs live only in data.

Use mapper names and methods consistently:

- `toEntity()`
- `toModel()`
- `toDto()`
- `fromEntity()`
- `fromDto()`

Do not expose DTOs, DAOs, table rows, `QueryRow`, or SDK response objects outside data and app/di wiring.

## Drift Placement

App-specific Drift code belongs in:

```text
data/local_database/
```

This includes:

- `AppDatabase`.
- Tables.
- DAOs.
- Migrations.
- Row mapping tied to the app schema.

Generic database connection factories may live in `core/database/`, but anything that knows app tables or business context belongs to data.

## Reactive Drift Queries

When a screen needs an entity plus aggregates or related table data, prefer one reactive Drift query over combining streams in UI/domain.

Use `customSelect` with `readsFrom`:

```dart
Stream<ItemDetailRow?> watchItemDetail(String id) {
  return customSelect(
    '''
    SELECT i.*,
      (SELECT COUNT(*) FROM children WHERE item_id = ?1) AS children_count
    FROM items i
    WHERE i.id = ?1
    ''',
    variables: [Variable.withString(id)],
    readsFrom: {
      itemsTable,
      childrenTable,
    },
  ).watchSingleOrNull().map((row) {
    if (row == null) return null;

    return ItemDetailRow(
      item: itemsTable.map(row.data),
      childrenCount: row.read<int>('children_count'),
    );
  });
}
```

Rules:

- SQL table names are Drift `tableName` values, not Dart class names.
- Every table mentioned in SQL must be listed in `readsFrom`.
- Forgetting a table in `readsFrom` means the stream will not re-emit when that table changes.
- DAO output can be Drift-friendly, but the repository converts it to domain entities.
- Domain defines aggregate entities; data only fills them.

## Avoid N+1 Queries

Do not query per item inside `for` or `map`.

Bad:

```dart
for (final item in items) {
  final count = await dao.countChildren(item.id);
}
```

Good:

```text
Use one customSelect with JOIN, subqueries, grouping, or aggregation.
```

Use `Rx.combineLatest` only when one SQL query would become much more complex and the lists are genuinely independent.

## LocalStorage vs Drift

Prefer a lightweight key-value wrapper, usually in core, for:

- Theme mode.
- Locale.
- Onboarding seen.
- Simple flags.
- Single values by key.

Use Drift for:

- Entities.
- Relationships.
- Lists of records.
- Queries and filters.
- Data with lifecycle, migrations, or structure.

Do not create tables for simple preferences unless they are structured, versioned, or related to business entities.

## Testing

Apply TDD where risk exists:

- Data sources with fake DAOs/clients.
- Repository implementations with fake data sources.
- Error conversion from Exception to Failure.
- Mapper behavior when it contains non-trivial logic.

Do not over-test DTOs or trivial mappers that only copy fields, unless they contain parsing/default rules.

## Review Checklist

- Data does not import UI or app.
- Domain contracts remain in domain.
- Repository impl converts Exceptions to Failures.
- DTOs and Drift classes do not leak outside data.
- Drift app schema is in `data/local_database`, not core.
- Reactive `customSelect` declares all `readsFrom` tables.
- No N+1 query loops.
- SQL variables use typed `Variable.withString`, `Variable.withInt`, etc.
