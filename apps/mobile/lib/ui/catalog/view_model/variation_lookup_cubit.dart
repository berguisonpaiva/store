import 'package:bloc/bloc.dart';
import 'package:fpdart/fpdart.dart';

import '../../../domain/catalog/entities/variation_lookup_entity.dart';
import '../../../domain/catalog/errors/catalog_failure.dart';
import '../../../domain/catalog/usecases/find_variation_by_barcode_usecase.dart';
import '../../../domain/catalog/usecases/find_variation_by_sku_usecase.dart';
import 'variation_lookup_state.dart';

/// Drives the PDV lookup: resolves a variation by SKU or barcode. No Flutter
/// imports.
class VariationLookupCubit extends Cubit<VariationLookupState> {
  VariationLookupCubit({
    required FindVariationBySkuUseCase findBySku,
    required FindVariationByBarcodeUseCase findByBarcode,
  }) : _findBySku = findBySku,
       _findByBarcode = findByBarcode,
       super(const VariationLookupState());

  final FindVariationBySkuUseCase _findBySku;
  final FindVariationByBarcodeUseCase _findByBarcode;

  Future<void> lookupBySku(String sku) => _run(sku, () => _findBySku(sku.trim()));

  Future<void> lookupByBarcode(String barcode) =>
      _run(barcode, () => _findByBarcode(barcode.trim()));

  Future<void> _run(
    String raw,
    Future<Either<CatalogFailure, VariationLookupEntity>> Function() call,
  ) async {
    if (raw.trim().isEmpty) return;

    emit(const VariationLookupState(status: VariationLookupStatus.loading));
    final result = await call();
    result.match(
      (failure) => emit(
        VariationLookupState(
          status: failure is VariationNotFoundFailure
              ? VariationLookupStatus.notFound
              : VariationLookupStatus.error,
          errorCode: failure.code,
        ),
      ),
      (lookup) => emit(
        VariationLookupState(
          status: VariationLookupStatus.loaded,
          result: lookup,
        ),
      ),
    );
  }

  void reset() => emit(const VariationLookupState());
}
