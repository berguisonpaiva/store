import 'package:bloc/bloc.dart';

import '../../../domain/caixa/usecases/obter_caixa_aberto_usecase.dart';
import 'caixa_status_state.dart';

/// Resolves whether the operator has an open cash session, so the status screen
/// can branch to opening or to the active session. No Flutter imports.
class CaixaStatusCubit extends Cubit<CaixaStatusState> {
  CaixaStatusCubit({required ObterCaixaAbertoUseCase obterCaixaAberto})
    : _obterCaixaAberto = obterCaixaAberto,
      super(const CaixaStatusState());

  final ObterCaixaAbertoUseCase _obterCaixaAberto;

  Future<void> load() async {
    emit(const CaixaStatusState(status: CaixaStatusValue.loading));
    final result = await _obterCaixaAberto();
    result.match(
      (failure) => emit(
        CaixaStatusState(
          status: CaixaStatusValue.error,
          errorCode: failure.code,
        ),
      ),
      (session) => emit(
        session == null
            ? const CaixaStatusState(status: CaixaStatusValue.noSession)
            : CaixaStatusState(
                status: CaixaStatusValue.sessionOpen,
                session: session,
              ),
      ),
    );
  }
}
