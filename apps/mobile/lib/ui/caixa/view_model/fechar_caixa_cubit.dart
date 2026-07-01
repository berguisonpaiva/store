import 'package:bloc/bloc.dart';

import '../../../domain/caixa/usecases/fechar_caixa_usecase.dart';
import 'fechar_caixa_state.dart';

/// Drives the close-cash form: tracks the counted amount so the view can show
/// expected/counted/divergence live, and closes the session
/// (`valorFechamento >= 0`, validated in the use case). No Flutter imports.
class FecharCaixaCubit extends Cubit<FecharCaixaState> {
  FecharCaixaCubit({
    required FecharCaixaUseCase fecharCaixa,
    required int esperadoCents,
  }) : _fecharCaixa = fecharCaixa,
       super(FecharCaixaState(esperadoCents: esperadoCents));

  final FecharCaixaUseCase _fecharCaixa;

  /// Updates the counted amount (cents) typed by the operator. Pass `null` to
  /// clear it (e.g. when the field is emptied).
  void contadoChanged(int? contadoCents) {
    emit(
      contadoCents == null
          ? state.copyWith(resetContado: true)
          : state.copyWith(contadoCents: contadoCents),
    );
  }

  Future<void> submit({required String sessaoId}) async {
    final contado = state.contadoCents;
    if (contado == null) return;

    emit(state.copyWith(status: FecharCaixaStatus.submitting));
    final result = await _fecharCaixa(
      sessaoId: sessaoId,
      valorFechamentoCents: contado,
    );
    result.match(
      (failure) => emit(
        state.copyWith(
          status: FecharCaixaStatus.failure,
          errorCode: failure.code,
        ),
      ),
      (session) => emit(
        state.copyWith(status: FecharCaixaStatus.success, session: session),
      ),
    );
  }
}
