import 'package:bloc/bloc.dart';

import '../../../domain/caixa/usecases/abrir_caixa_usecase.dart';
import '../../../domain/caixa/usecases/obter_caixa_aberto_usecase.dart';
import 'abrir_caixa_state.dart';

/// Drives the open-cash form (`valorAbertura >= 0`, validated in the use case).
///
/// Before showing the form, [checkOpenSession] pre-checks whether the operator
/// already has an open session and blocks it preventively; the backend stays
/// authoritative — `CAIXA_JA_ABERTO` on submit is still handled. No Flutter
/// imports.
class AbrirCaixaCubit extends Cubit<AbrirCaixaState> {
  AbrirCaixaCubit({
    required AbrirCaixaUseCase abrirCaixa,
    required ObterCaixaAbertoUseCase obterCaixaAberto,
  }) : _abrirCaixa = abrirCaixa,
       _obterCaixaAberto = obterCaixaAberto,
       super(const AbrirCaixaState());

  final AbrirCaixaUseCase _abrirCaixa;
  final ObterCaixaAbertoUseCase _obterCaixaAberto;

  /// Preventive UX check (spec: open screen blocks when a session is already
  /// `ABERTA`). On failure the form stays usable — the API still rejects a
  /// duplicate opening with `CAIXA_JA_ABERTO`.
  Future<void> checkOpenSession() async {
    emit(const AbrirCaixaState(status: AbrirCaixaStatus.checking));
    final result = await _obterCaixaAberto();
    result.match(
      (_) => emit(const AbrirCaixaState()),
      (session) => emit(
        session == null
            ? const AbrirCaixaState()
            : AbrirCaixaState(
                status: AbrirCaixaStatus.blocked,
                activeSession: session,
              ),
      ),
    );
  }

  Future<void> submit({required int valorAberturaCents}) async {
    emit(const AbrirCaixaState(status: AbrirCaixaStatus.submitting));
    final result = await _abrirCaixa(valorAberturaCents: valorAberturaCents);
    result.match(
      (failure) => emit(
        AbrirCaixaState(
          status: AbrirCaixaStatus.failure,
          errorCode: failure.code,
        ),
      ),
      (session) => emit(
        AbrirCaixaState(status: AbrirCaixaStatus.success, session: session),
      ),
    );
  }
}
