import 'package:bloc/bloc.dart';

import '../../../domain/inventory/usecases/list_movements_usecase.dart';
import 'movements_state.dart';

/// Drives the movement-history screen for a variation, with an optional period
/// filter. No Flutter imports.
class MovementsCubit extends Cubit<MovementsState> {
  MovementsCubit({required ListMovementsUseCase listMovements})
    : _listMovements = listMovements,
      super(const MovementsState());

  final ListMovementsUseCase _listMovements;

  Future<void> load({
    required String variacaoId,
    DateTime? from,
    DateTime? to,
    int page = 1,
    int pageSize = 20,
  }) async {
    final id = variacaoId.trim();
    if (id.isEmpty) return;

    emit(const MovementsState(status: MovementsStatus.loading));
    final result = await _listMovements(
      variacaoId: id,
      from: from,
      to: to,
      page: page,
      pageSize: pageSize,
    );
    result.match(
      (failure) => emit(
        MovementsState(
          status: MovementsStatus.error,
          errorCode: failure.code,
        ),
      ),
      (page) => emit(
        MovementsState(status: MovementsStatus.loaded, page: page),
      ),
    );
  }
}
