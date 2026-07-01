import 'package:bloc/bloc.dart';

import '../../../domain/inventory/entities/stock_movement_reason.dart';
import '../../../domain/inventory/errors/inventory_failure.dart';
import '../../../domain/inventory/usecases/adjust_balance_usecase.dart';
import '../../../domain/inventory/usecases/register_entry_usecase.dart';
import '../../../domain/inventory/usecases/register_exit_usecase.dart';
import 'stock_movement_state.dart';

/// Drives the entry/exit/adjustment forms. Quantity (> 0) and target balance
/// (>= 0) are validated inside the use cases. No Flutter imports.
class StockMovementCubit extends Cubit<StockMovementState> {
  StockMovementCubit({
    required RegisterEntryUseCase registerEntry,
    required RegisterExitUseCase registerExit,
    required AdjustBalanceUseCase adjustBalance,
  }) : _registerEntry = registerEntry,
       _registerExit = registerExit,
       _adjustBalance = adjustBalance,
       super(const StockMovementState());

  final RegisterEntryUseCase _registerEntry;
  final RegisterExitUseCase _registerExit;
  final AdjustBalanceUseCase _adjustBalance;

  Future<void> registerEntry({
    required String variacaoId,
    required int quantidade,
    required StockMovementReason motivo,
  }) async {
    emit(const StockMovementState(status: StockMovementStatus.submitting));
    final result = await _registerEntry(
      variacaoId: variacaoId.trim(),
      quantidade: quantidade,
      motivo: motivo,
    );
    result.match(_emitFailure, (_) => _emitSuccess());
  }

  Future<void> registerExit({
    required String variacaoId,
    required int quantidade,
    required StockMovementReason motivo,
  }) async {
    emit(const StockMovementState(status: StockMovementStatus.submitting));
    final result = await _registerExit(
      variacaoId: variacaoId.trim(),
      quantidade: quantidade,
      motivo: motivo,
    );
    result.match(_emitFailure, (_) => _emitSuccess());
  }

  Future<void> adjustBalance({
    required String variacaoId,
    required int novoSaldo,
    required String observacao,
  }) async {
    emit(const StockMovementState(status: StockMovementStatus.submitting));
    final result = await _adjustBalance(
      variacaoId: variacaoId.trim(),
      novoSaldo: novoSaldo,
      observacao: observacao.trim(),
    );
    result.match(_emitFailure, (_) => _emitSuccess());
  }

  void _emitSuccess() =>
      emit(const StockMovementState(status: StockMovementStatus.success));

  void _emitFailure(InventoryFailure failure) => emit(
    StockMovementState(
      status: StockMovementStatus.failure,
      errorCode: failure.code,
    ),
  );
}
