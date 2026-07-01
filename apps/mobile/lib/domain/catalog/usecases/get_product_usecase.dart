import 'package:fpdart/fpdart.dart';

import '../entities/product_entity.dart';
import '../errors/catalog_failure.dart';
import '../repositories/catalog_repository.dart';

/// Fetches a single product with its variations.
class GetProductUseCase {
  const GetProductUseCase(this._repository);

  final CatalogRepository _repository;

  Future<Either<CatalogFailure, ProductEntity>> call(String id) =>
      _repository.getProduct(id);
}
