import 'package:get_it/get_it.dart';

import '../../core/auth/jwt_decoder.dart';
import '../../core/network/http_client.dart';
import '../../core/storage/secure_storage.dart';
import '../../data/auth/datasources/auth_remote_data_source.dart';
import '../../data/auth/datasources/auth_remote_data_source_impl.dart';
import '../../data/auth/repositories/auth_repository_impl.dart';
import '../../data/caixa/datasources/caixa_remote_data_source.dart';
import '../../data/caixa/datasources/caixa_remote_data_source_impl.dart';
import '../../data/caixa/repositories/caixa_repository_impl.dart';
import '../../data/catalog/datasources/catalog_remote_data_source.dart';
import '../../data/catalog/datasources/catalog_remote_data_source_impl.dart';
import '../../data/catalog/repositories/catalog_repository_impl.dart';
import '../../data/database/app_database.dart';
import '../../data/database/database_connection.dart';
import '../../data/inventory/datasources/inventory_remote_data_source.dart';
import '../../data/inventory/datasources/inventory_remote_data_source_impl.dart';
import '../../data/inventory/repositories/inventory_repository_impl.dart';
import '../../data/vendas/datasources/vendas_remote_data_source.dart';
import '../../data/vendas/datasources/vendas_remote_data_source_impl.dart';
import '../../data/vendas/repositories/vendas_repository_impl.dart';
import '../../domain/auth/repositories/auth_repository.dart';
import '../../domain/caixa/repositories/caixa_repository.dart';
import '../../domain/catalog/repositories/catalog_repository.dart';
import '../../domain/inventory/repositories/inventory_repository.dart';
import '../../domain/vendas/repositories/vendas_repository.dart';

/// Registers data sources, repository implementations and persistence.
void registerDataModule(GetIt gi) {
  gi.registerLazySingleton<AppDatabase>(() => AppDatabase(openConnection()));
  gi.registerLazySingleton<ExampleDao>(() => gi<AppDatabase>().exampleDao);

  gi.registerLazySingleton<AuthRemoteDataSource>(
    () => AuthRemoteDataSourceImpl(gi<HttpClient>()),
  );
  gi.registerLazySingleton<AuthRepository>(
    () => AuthRepositoryImpl(
      remote: gi<AuthRemoteDataSource>(),
      storage: gi<SecureStorage>(),
      jwtDecoder: gi<JwtDecoder>(),
    ),
  );

  gi.registerLazySingleton<InventoryRemoteDataSource>(
    () => InventoryRemoteDataSourceImpl(gi<HttpClient>()),
  );
  gi.registerLazySingleton<InventoryRepository>(
    () => InventoryRepositoryImpl(gi<InventoryRemoteDataSource>()),
  );

  gi.registerLazySingleton<CaixaRemoteDataSource>(
    () => CaixaRemoteDataSourceImpl(gi<HttpClient>()),
  );
  gi.registerLazySingleton<CaixaRepository>(
    () => CaixaRepositoryImpl(gi<CaixaRemoteDataSource>()),
  );

  gi.registerLazySingleton<CatalogRemoteDataSource>(
    () => CatalogRemoteDataSourceImpl(gi<HttpClient>()),
  );
  gi.registerLazySingleton<CatalogRepository>(
    () => CatalogRepositoryImpl(gi<CatalogRemoteDataSource>()),
  );

  gi.registerLazySingleton<VendasRemoteDataSource>(
    () => VendasRemoteDataSourceImpl(gi<HttpClient>()),
  );
  gi.registerLazySingleton<VendasRepository>(
    () => VendasRepositoryImpl(gi<VendasRemoteDataSource>()),
  );
}
