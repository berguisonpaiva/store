import 'package:drift/drift.dart';

part 'app_database.g.dart';

/// Placeholder table so the schema is valid. Replace/extend with real business
/// tables in feature changes.
class Examples extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get name => text().withLength(min: 1, max: 100)();
}

/// Example DAO demonstrating the persistence pattern. Business DAOs follow this
/// shape in feature changes.
@DriftAccessor(tables: [Examples])
class ExampleDao extends DatabaseAccessor<AppDatabase> with _$ExampleDaoMixin {
  ExampleDao(super.db);

  Future<List<Example>> getAll() => select(examples).get();
}

/// Local Drift database. Built on an injected [QueryExecutor] so tests can use
/// an in-memory connection.
@DriftDatabase(tables: [Examples], daos: [ExampleDao])
class AppDatabase extends _$AppDatabase {
  AppDatabase(super.e);

  @override
  int get schemaVersion => 1;
}
