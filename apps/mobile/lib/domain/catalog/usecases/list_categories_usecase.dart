import 'package:fpdart/fpdart.dart';

import '../entities/category_entity.dart';
import '../errors/catalog_failure.dart';
import '../repositories/catalog_repository.dart';

/// Lists catalog categories (used to populate the product filter).
class ListCategoriesUseCase {
  const ListCategoriesUseCase(this._repository);

  final CatalogRepository _repository;

  Future<Either<CatalogFailure, List<CategoryEntity>>> call({bool? active}) =>
      _repository.listCategories(active: active);
}
