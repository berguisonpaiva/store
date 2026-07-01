import 'package:fpdart/fpdart.dart';

import '../entities/variation_lookup_entity.dart';
import '../errors/catalog_failure.dart';
import '../repositories/catalog_repository.dart';

/// Resolves a variation (and its product) by barcode — the PDV bipe.
class FindVariationByBarcodeUseCase {
  const FindVariationByBarcodeUseCase(this._repository);

  final CatalogRepository _repository;

  Future<Either<CatalogFailure, VariationLookupEntity>> call(String barcode) =>
      _repository.findVariationByBarcode(barcode);
}
