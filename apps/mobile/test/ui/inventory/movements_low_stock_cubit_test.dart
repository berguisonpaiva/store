import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fpdart/fpdart.dart';
import 'package:mobile/domain/inventory/entities/low_stock_item_entity.dart';
import 'package:mobile/domain/inventory/entities/stock_movements_page_entity.dart';
import 'package:mobile/domain/inventory/errors/inventory_failure.dart';
import 'package:mobile/domain/inventory/usecases/list_low_stock_usecase.dart';
import 'package:mobile/domain/inventory/usecases/list_movements_usecase.dart';
import 'package:mobile/ui/inventory/view_model/low_stock_cubit.dart';
import 'package:mobile/ui/inventory/view_model/low_stock_state.dart';
import 'package:mobile/ui/inventory/view_model/movements_cubit.dart';
import 'package:mobile/ui/inventory/view_model/movements_state.dart';
import 'package:mocktail/mocktail.dart';

class _MockListMovements extends Mock implements ListMovementsUseCase {}

class _MockListLowStock extends Mock implements ListLowStockUseCase {}

const _emptyPage = StockMovementsPageEntity(
  items: [],
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0,
);

void main() {
  group('MovementsCubit', () {
    late _MockListMovements listMovements;

    setUp(() => listMovements = _MockListMovements());

    blocTest<MovementsCubit, MovementsState>(
      'loads a page with the period filter forwarded',
      setUp: () => when(
        () => listMovements(
          variacaoId: any(named: 'variacaoId'),
          from: any(named: 'from'),
          to: any(named: 'to'),
          page: any(named: 'page'),
          pageSize: any(named: 'pageSize'),
        ),
      ).thenAnswer((_) async => right(_emptyPage)),
      build: () => MovementsCubit(listMovements: listMovements),
      act: (cubit) => cubit.load(variacaoId: 'v1', from: DateTime(2026, 1, 1)),
      expect: () => const [
        MovementsState(status: MovementsStatus.loading),
        MovementsState(status: MovementsStatus.loaded, page: _emptyPage),
      ],
      verify: (_) => verify(
        () => listMovements(
          variacaoId: 'v1',
          from: DateTime(2026, 1, 1),
          to: null,
          page: 1,
          pageSize: 20,
        ),
      ).called(1),
    );
  });

  group('LowStockCubit', () {
    late _MockListLowStock listLowStock;

    setUp(() => listLowStock = _MockListLowStock());

    blocTest<LowStockCubit, LowStockState>(
      'loaded → loading then loaded with items',
      setUp: () => when(() => listLowStock()).thenAnswer(
        (_) async => right(const [
          LowStockItemEntity(
            variacaoId: 'v1',
            saldoAtual: 1,
            estoqueMinimo: 5,
          ),
        ]),
      ),
      build: () => LowStockCubit(listLowStock: listLowStock),
      act: (cubit) => cubit.load(),
      expect: () => [
        const LowStockState(status: LowStockStatus.loading),
        isA<LowStockState>()
            .having((s) => s.status, 'status', LowStockStatus.loaded)
            .having((s) => s.items.length, 'items', 1),
      ],
    );

    blocTest<LowStockCubit, LowStockState>(
      'error → loading then error with code',
      setUp: () => when(() => listLowStock())
          .thenAnswer((_) async => left(const InventoryNetworkFailure())),
      build: () => LowStockCubit(listLowStock: listLowStock),
      act: (cubit) => cubit.load(),
      expect: () => [
        const LowStockState(status: LowStockStatus.loading),
        isA<LowStockState>().having(
          (s) => s.status,
          'status',
          LowStockStatus.error,
        ),
      ],
    );
  });
}
