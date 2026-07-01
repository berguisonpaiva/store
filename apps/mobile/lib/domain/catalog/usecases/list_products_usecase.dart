import 'package:fpdart/fpdart.dart';

import '../entities/products_page_entity.dart';
import '../errors/catalog_failure.dart';
import '../repositories/catalog_repository.dart';

/// Lists products with search, category/status filters, and pagination.
class ListProductsUseCase {
  const ListProductsUseCase(this._repository);

  final CatalogRepository _repository;

  Future<Either<CatalogFailure, ProductsPageEntity>> call({
    int page = 1,
    int pageSize = 20,
    String? name,
    String? categoryId,
    bool? active,
  }) => _repository.listProducts(
    page: page,
    pageSize: pageSize,
    name: name,
    categoryId: categoryId,
    active: active,
  );
}
