import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fpdart/fpdart.dart';
import 'package:mobile/domain/catalog/entities/variation_entity.dart';
import 'package:mobile/domain/catalog/entities/variation_lookup_entity.dart';
import 'package:mobile/domain/catalog/errors/catalog_failure.dart';
import 'package:mobile/domain/catalog/usecases/find_variation_by_barcode_usecase.dart';
import 'package:mobile/domain/catalog/usecases/find_variation_by_sku_usecase.dart';
import 'package:mobile/ui/catalog/view_model/variation_lookup_cubit.dart';
import 'package:mobile/ui/catalog/view_model/variation_lookup_state.dart';
import 'package:mocktail/mocktail.dart';

class _MockFindBySku extends Mock implements FindVariationBySkuUseCase {}

class _MockFindByBarcode extends Mock implements FindVariationByBarcodeUseCase {}

const _lookup = VariationLookupEntity(
  productId: 'p1',
  productName: 'Shirt',
  productActive: true,
  variation: VariationEntity(
    id: 'v1',
    sku: 'SH-1',
    barcode: '789',
    attributes: {},
    priceCents: 1990,
    minStock: 3,
    active: true,
  ),
);

void main() {
  late _MockFindBySku findBySku;
  late _MockFindByBarcode findByBarcode;

  setUp(() {
    findBySku = _MockFindBySku();
    findByBarcode = _MockFindByBarcode();
  });

  VariationLookupCubit build() =>
      VariationLookupCubit(findBySku: findBySku, findByBarcode: findByBarcode);

  blocTest<VariationLookupCubit, VariationLookupState>(
    'barcode hit → loading then loaded with the result',
    setUp: () => when(() => findByBarcode(any()))
        .thenAnswer((_) async => right(_lookup)),
    build: build,
    act: (cubit) => cubit.lookupByBarcode('789'),
    expect: () => [
      const VariationLookupState(status: VariationLookupStatus.loading),
      const VariationLookupState(
        status: VariationLookupStatus.loaded,
        result: _lookup,
      ),
    ],
    verify: (_) => verify(() => findByBarcode('789')).called(1),
  );

  blocTest<VariationLookupCubit, VariationLookupState>(
    'sku miss → loading then notFound',
    setUp: () => when(() => findBySku(any()))
        .thenAnswer((_) async => left(const VariationNotFoundFailure())),
    build: build,
    act: (cubit) => cubit.lookupBySku('nope'),
    expect: () => [
      const VariationLookupState(status: VariationLookupStatus.loading),
      isA<VariationLookupState>().having(
        (s) => s.status,
        'status',
        VariationLookupStatus.notFound,
      ),
    ],
  );

  blocTest<VariationLookupCubit, VariationLookupState>(
    'blank input → no use case call, no emit',
    build: build,
    act: (cubit) => cubit.lookupBySku('   '),
    expect: () => const <VariationLookupState>[],
    verify: (_) => verifyNever(() => findBySku(any())),
  );
}
