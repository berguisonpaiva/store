import 'package:bloc/bloc.dart';

import '../../../domain/vendas/entities/status_venda.dart';
import '../../../domain/vendas/repositories/vendas_repository.dart';
import '../../../domain/vendas/usecases/listar_vendas_usecase.dart';
import 'vendas_history_state.dart';

/// Drives the operator's own sales-history screen. Lists the caller's sales via
/// `ListarVendasUseCase`; the backend scopes non-ADMIN callers to their own
/// sales (RN03), so no `usuarioId` is passed. No Flutter imports.
class VendasHistoryCubit extends Cubit<VendasHistoryState> {
  VendasHistoryCubit({required ListarVendasUseCase listarVendas})
    : _listarVendas = listarVendas,
      super(const VendasHistoryState());

  final ListarVendasUseCase _listarVendas;

  /// Loads the history, optionally filtered by [status].
  Future<void> load({StatusVenda? status}) async {
    emit(
      state.copyWith(
        status: VendasHistoryStatus.loading,
        filtroStatus: status,
        clearFiltroStatus: status == null,
      ),
    );
    final result = await _listarVendas(VendasFiltro(status: status));
    result.match(
      (failure) => emit(
        state.copyWith(
          status: VendasHistoryStatus.error,
          errorCode: failure.code,
        ),
      ),
      (vendas) => emit(
        state.copyWith(status: VendasHistoryStatus.loaded, vendas: vendas),
      ),
    );
  }

  /// Applies (or clears, when [status] is null) the status filter and reloads.
  Future<void> filterByStatus(StatusVenda? status) => load(status: status);
}
