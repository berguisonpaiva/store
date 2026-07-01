import 'package:fpdart/fpdart.dart';

import '../entities/category_entity.dart';
import '../entities/product_entity.dart';
import '../entities/products_page_entity.dart';
import '../entities/variation_lookup_entity.dart';
import '../errors/catalog_failure.dart';

/// Catalog contract owned by the domain. Implemented in `data` against the
/// backend `/api/products`, `/api/variations`, and `/api/categories`
/// endpoints. Business outcomes are returned as `Either<CatalogFailure, T>`.
abstract interface class CatalogRepository {
  /// `GET /api/products` — paginated, with optional name search and
  /// category/status filters.
  Future<Either<CatalogFailure, ProductsPageEntity>> listProducts({
    int page,
    int pageSize,
    String? name,
    String? categoryId,
    bool? active,
  });

  /// `GET /api/products/:id`.
  Future<Either<CatalogFailure, ProductEntity>> getProduct(String id);

  /// `GET /api/variations/by-sku/:sku`.
  Future<Either<CatalogFailure, VariationLookupEntity>> findVariationBySku(
    String sku,
  );

  /// `GET /api/variations/by-barcode/:barcode`.
  Future<Either<CatalogFailure, VariationLookupEntity>> findVariationByBarcode(
    String barcode,
  );

  /// `GET /api/categories`.
  Future<Either<CatalogFailure, List<CategoryEntity>>> listCategories({
    bool? active,
  });
}
