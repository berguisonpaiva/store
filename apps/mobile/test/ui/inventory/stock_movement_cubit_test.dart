import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fpdart/fpdart.dart';
import 'package:mobile/domain/inventory/entities/stock_movement_reason.dart';
import 'package:mobile/domain/inventory/errors/inventory_failure.dart';
import 'package:mobile/domain/inventory/usecases/adjust_balance_usecase.dart';
import 'package:mobile/domain/inventory/usecases/register_entry_usecase.dart';
import 'package:mobile/domain/inventory/usecases/register_exit_usecase.dart';
import 'package:mobile/ui/inventory/view_model/stock_movement_cubit.dart';
import 'package:mobile/ui/inventory/view_model/stock_movement_state.dart';
import 'package:mocktail/mocktail.dart';

class _MockRegisterEntry extends Mock implements RegisterEntryUseCase {}

class _MockRegisterExit extends Mock implements RegisterExitUseCase {}

class _MockAdjustBalance extends Mock implements AdjustBalanceUseCase {}

void main() {
  late _MockRegisterEntry registerEntry;
  late _MockRegisterExit registerExit;
  late _MockAdjustBalance adjustBalance;

  setUpAll(
    () => registerFallbackValue(StockMovementReason.compra),
  );

  setUp(() {
    registerEntry = _MockRegisterEntry();
    registerExit = _MockRegisterExit();
    adjustBalance = _MockAdjustBalance();
  });

  StockMovementCubit build() => StockMovementCubit(
    registerEntry: registerEntry,
    registerExit: registerExit,
    adjustBalance: adjustBalance,
  );

  blocTest<StockMovementCubit, StockMovementState>(
    'entry success → submitting then success',
    setUp: () => when(
      () => registerEntry(
        variacaoId: any(named: 'variacaoId'),
        quantidade: any(named: 'quantidade'),
        motivo: any(named: 'motivo'),
      ),
    ).thenAnswer((_) async => right(unit)),
    build: build,
    act: (cubit) => cubit.registerEntry(
      variacaoId: 'v1',
      quantidade: 5,
      motivo: StockMovementReason.compra,
    ),
    expect: () => const [
      StockMovementState(status: StockMovementStatus.submitting),
      StockMovementState(status: StockMovementStatus.success),
    ],
  );

  blocTest<StockMovementCubit, StockMovementState>(
    'exit insufficient stock → submitting then failure with code',
    setUp: () => when(
      () => registerExit(
        variacaoId: any(named: 'variacaoId'),
        quantidade: any(named: 'quantidade'),
        motivo: any(named: 'motivo'),
      ),
    ).thenAnswer((_) async => left(const InsufficientStockFailure())),
    build: build,
    act: (cubit) => cubit.registerExit(
      variacaoId: 'v1',
      quantidade: 99,
      motivo: StockMovementReason.perda,
    ),
    expect: () => [
      const StockMovementState(status: StockMovementStatus.submitting),
      isA<StockMovementState>()
          .having((s) => s.status, 'status', StockMovementStatus.failure)
          .having(
            (s) => s.errorCode,
            'errorCode',
            'inventory.insufficient_stock',
          ),
    ],
  );

  blocTest<StockMovementCubit, StockMovementState>(
    'adjust invalid quantity → submitting then failure with code',
    setUp: () => when(
      () => adjustBalance(
        variacaoId: any(named: 'variacaoId'),
        novoSaldo: any(named: 'novoSaldo'),
        observacao: any(named: 'observacao'),
      ),
    ).thenAnswer((_) async => left(const InvalidQuantityFailure())),
    build: build,
    act: (cubit) => cubit.adjustBalance(
      variacaoId: 'v1',
      novoSaldo: -1,
      observacao: 'recount',
    ),
    expect: () => [
      const StockMovementState(status: StockMovementStatus.submitting),
      isA<StockMovementState>()
          .having((s) => s.status, 'status', StockMovementStatus.failure)
          .having(
            (s) => s.errorCode,
            'errorCode',
            'inventory.invalid_quantity',
          ),
    ],
  );
}
