import 'package:bloc/bloc.dart';

import '../../../domain/caixa/usecases/abrir_caixa_usecase.dart';
import 'abrir_caixa_state.dart';

/// Drives the open-cash form (`valorAbertura >= 0`, validated in the use case).
/// No Flutter imports.
class AbrirCaixaCubit extends Cubit<AbrirCaixaState> {
  AbrirCaixaCubit({required AbrirCaixaUseCase abrirCaixa})
    : _abrirCaixa = abrirCaixa,
      super(const AbrirCaixaState());

  final AbrirCaixaUseCase _abrirCaixa;

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
