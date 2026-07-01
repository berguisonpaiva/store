import 'package:fpdart/fpdart.dart';

import '../entities/variation_lookup_entity.dart';
import '../errors/catalog_failure.dart';
import '../repositories/catalog_repository.dart';

/// Resolves a variation (and its product) by SKU — the PDV lookup.
class FindVariationBySkuUseCase {
  const FindVariationBySkuUseCase(this._repository);

  final CatalogRepository _repository;

  Future<Either<CatalogFailure, VariationLookupEntity>> call(String sku) =>
      _repository.findVariationBySku(sku);
}
