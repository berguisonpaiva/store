# Domain Checklist

- Domain has no Flutter/framework imports.
- Domain does not import data, core, ui, or app.
- Entities represent business concepts, not database rows.
- Value objects wrap primitives with rule or meaning.
- Repository files are interfaces only.
- Use cases represent named business actions.
- Avoid pass-through use cases with no rule, orchestration, or reuse.
- One-shot operations return `Future<Either<Failure, T>>`.
- Reactive operations return `Stream<T>`.
- Editable entities have full optional `copyWith`.
- Domain tests run without Flutter.
