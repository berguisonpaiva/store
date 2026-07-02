import 'package:bloc/bloc.dart';

import '../../../domain/caixa/entities/cash_session_status.dart';
import '../../../domain/caixa/repositories/caixa_repository.dart';
import '../../../domain/caixa/usecases/listar_sessoes_usecase.dart';
import 'caixa_history_state.dart';

/// Drives the operator's own cash-session history. Lists the caller's sessions
/// via `ListarSessoesUseCase`; the backend scopes `GET /caixa/minhas` to the
/// caller (RN03). No Flutter imports.
class CaixaHistoryCubit extends Cubit<CaixaHistoryState> {
  CaixaHistoryCubit({required ListarSessoesUseCase listarSessoes})
    : _listarSessoes = listarSessoes,
      super(const CaixaHistoryState());

  final ListarSessoesUseCase _listarSessoes;

  /// Loads the history, optionally filtered by [status].
  Future<void> load({CashSessionStatus? status}) async {
    emit(
      state.copyWith(
        status: CaixaHistoryStatus.loading,
        filtroStatus: status,
        clearFiltroStatus: status == null,
      ),
    );
    final result = await _listarSessoes(SessoesCaixaFiltro(status: status));
    result.match(
      (failure) => emit(
        state.copyWith(
          status: CaixaHistoryStatus.error,
          errorCode: failure.code,
        ),
      ),
      (sessoes) => emit(
        state.copyWith(status: CaixaHistoryStatus.loaded, sessoes: sessoes),
      ),
    );
  }

  /// Applies (or clears, when [status] is null) the status filter and reloads.
  Future<void> filterByStatus(CashSessionStatus? status) =>
      load(status: status);
}
