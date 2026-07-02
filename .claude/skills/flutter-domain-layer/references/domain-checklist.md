# Domain Checklist

- Domain has no Flutter/framework imports.
- Domain does not import data, core, ui, or app.
- Entities represent business concepts, not database rows.
- Value objects wrap primitives with rule or meaning.
- Repository files are interfaces only.
- Repositories expose commands and entity reads required by write invariants, not consumer projections.
- Query files are interfaces only and return framework-free read models.
- Read models contain no entity behavior, data DTO, DAO, Drift, HTTP, JSON, or SDK types.
- Use cases represent named business actions.
- Avoid pass-through command use cases; thin query use cases are allowed when they stabilize the application boundary.
- One-shot operations return `Future<Either<Failure, T>>`.
- Reactive Queries return `Stream<T>`.
- Editable entities have full optional `copyWith`.
- Domain tests run without Flutter.
- Command tests fake Repositories; query tests fake Queries.
