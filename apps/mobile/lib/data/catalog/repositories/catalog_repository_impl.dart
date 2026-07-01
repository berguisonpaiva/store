import 'package:fpdart/fpdart.dart';

import '../../../core/errors/app_exception.dart';
import '../../../domain/catalog/entities/category_entity.dart';
import '../../../domain/catalog/entities/product_entity.dart';
import '../../../domain/catalog/entities/products_page_entity.dart';
import '../../../domain/catalog/entities/variation_lookup_entity.dart';
import '../../../domain/catalog/errors/catalog_failure.dart';
import '../../../domain/catalog/repositories/catalog_repository.dart';
import '../datasources/catalog_remote_data_source.dart';

/// Default [CatalogRepository]. Delegates to the remote data source and
/// converts technical [AppException]s at the boundary into domain
/// [CatalogFailure]s (404 → not-found, anything else → network).
class CatalogRepositoryImpl implements CatalogRepository {
  const CatalogRepositoryImpl(this._remote);

  final CatalogRemoteDataSource _remote;

  @override
  Future<Either<CatalogFailure, ProductsPageEntity>> listProducts({
    int page = 1,
    int pageSize = 20,
    String? name,
    String? categoryId,
    bool? active,
  }) => _guard(() async {
    final dto = await _remote.listProducts(
      page: page,
      pageSize: pageSize,
      name: name,
      categoryId: categoryId,
      active: active,
    );
    return dto.toEntity();
  });

  @override
  Future<Either<CatalogFailure, ProductEntity>> getProduct(String id) =>
      _guard(() async {
        final dto = await _remote.getProduct(id);
        return dto.toEntity();
      }, notFound: const ProductNotFoundFailure());

  @override
  Future<Either<CatalogFailure, VariationLookupEntity>> findVariationBySku(
    String sku,
  ) => _guard(() async {
    final dto = await _remote.findVariationBySku(sku);
    return dto.toEntity();
  });

  @override
  Future<Either<CatalogFailure, VariationLookupEntity>> findVariationByBarcode(
    String barcode,
  ) => _guard(() async {
    final dto = await _remote.findVariationByBarcode(barcode);
    return dto.toEntity();
  });

  @override
  Future<Either<CatalogFailure, List<CategoryEntity>>> listCategories({
    bool? active,
  }) => _guard(() async {
    final dtos = await _remote.listCategories(active: active);
    return dtos.map((e) => e.toEntity()).toList();
  });

  /// Runs [run], converting any [AppException] into a [CatalogFailure]. A 404
  /// maps to [notFound] when provided, otherwise to [VariationNotFoundFailure].
  Future<Either<CatalogFailure, T>> _guard<T>(
    Future<T> Function() run, {
    CatalogFailure? notFound,
  }) async {
    try {
      return right(await run());
    } on AppException catch (e) {
      return left(_toFailure(e, notFound));
    }
  }

  CatalogFailure _toFailure(AppException e, CatalogFailure? notFound) {
    if (e is NetworkException && e.statusCode == 404) {
      return notFound ?? const VariationNotFoundFailure();
    }
    return const CatalogNetworkFailure();
  }
}
