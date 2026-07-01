# Data and Drift Checklist

- Repository implementation is in data, interface in domain.
- Data sources throw Exceptions or technical errors.
- Repositories convert Exceptions into Failures.
- DTOs/models/mappers stay in data.
- Drift schema, tables, DAOs, and AppDatabase stay in `data/local_database`.
- Core database code is generic only.
- SQL uses Drift table names, not Dart class names.
- Every SQL table in reactive `customSelect` appears in `readsFrom`.
- Aggregates and joins avoid N+1 queries.
- Repository exposes domain entities only.
