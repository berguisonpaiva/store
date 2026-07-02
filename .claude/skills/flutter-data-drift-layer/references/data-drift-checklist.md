# Data and Drift Checklist

- Repository and Query implementations are in data; interfaces are in domain.
- Repository adapters persist aggregates and load entities only for command invariants.
- Query adapters return read models for list/detail/filter/pagination/join/aggregate reads.
- Data sources throw Exceptions or technical errors.
- Repositories convert Exceptions into Failures.
- DTOs/models/mappers stay in data.
- Drift schema, tables, DAOs, and AppDatabase stay in `data/local_database`.
- Core database code is generic only.
- SQL uses Drift table names, not Dart class names.
- Every SQL table in reactive `customSelect` appears in `readsFrom`.
- Aggregates and joins avoid N+1 queries.
- Repository exposes domain entities only; Query exposes domain read models only.
- Query adapters do not reconstruct entities unnecessarily and never mutate state.
- Reactive Query adapters convert technical Exceptions to Failures on the stream error channel.
