import 'package:bloc/bloc.dart';

import '../../../domain/inventory/errors/inventory_failure.dart';
import '../../../domain/inventory/usecases/get_balance_usecase.dart';
import 'balance_lookup_state.dart';

/// Drives the balance lookup screen: resolves the current/available balance for
/// a typed variation id. No Flutter imports.
class BalanceLookupCubit extends Cubit<BalanceLookupState> {
  BalanceLookupCubit({required GetBalanceUseCase getBalance})
    : _getBalance = getBalance,
      super(const BalanceLookupState());

  final GetBalanceUseCase _getBalance;

  Future<void> lookup(String variacaoId) async {
    final id = variacaoId.trim();
    if (id.isEmpty) return;

    emit(const BalanceLookupState(status: BalanceLookupStatus.loading));
    final result = await _getBalance(id);
    result.match(
      (failure) => emit(
        BalanceLookupState(
          status: failure is VariationNotFoundFailure
              ? BalanceLookupStatus.notFound
              : BalanceLookupStatus.error,
          errorCode: failure.code,
        ),
      ),
      (balance) => emit(
        BalanceLookupState(
          status: BalanceLookupStatus.loaded,
          balance: balance,
        ),
      ),
    );
  }

  void reset() => emit(const BalanceLookupState());
}
