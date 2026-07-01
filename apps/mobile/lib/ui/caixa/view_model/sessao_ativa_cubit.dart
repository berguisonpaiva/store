import 'package:bloc/bloc.dart';

import '../../../domain/caixa/usecases/listar_movimentacoes_usecase.dart';
import '../../../domain/caixa/usecases/obter_resumo_sessao_usecase.dart';
import '../../../domain/caixa/usecases/registrar_sangria_usecase.dart';
import '../../../domain/caixa/usecases/registrar_suprimento_usecase.dart';
import 'sessao_ativa_state.dart';

/// Drives the active-session screen: loads the summary and movements, and
/// registers sangria/suprimento. No Flutter imports.
class SessaoAtivaCubit extends Cubit<SessaoAtivaState> {
  SessaoAtivaCubit({
    required ObterResumoSessaoUseCase obterResumo,
    required ListarMovimentacoesUseCase listarMovimentacoes,
    required RegistrarSangriaUseCase registrarSangria,
    required RegistrarSuprimentoUseCase registrarSuprimento,
  }) : _obterResumo = obterResumo,
       _listarMovimentacoes = listarMovimentacoes,
       _registrarSangria = registrarSangria,
       _registrarSuprimento = registrarSuprimento,
       super(const SessaoAtivaState());

  final ObterResumoSessaoUseCase _obterResumo;
  final ListarMovimentacoesUseCase _listarMovimentacoes;
  final RegistrarSangriaUseCase _registrarSangria;
  final RegistrarSuprimentoUseCase _registrarSuprimento;

  Future<void> load(String sessaoId) async {
    emit(state.copyWith(status: SessaoAtivaStatus.loading));

    final resumoResult = await _obterResumo(sessaoId);
    if (resumoResult.isLeft()) {
      emit(
        state.copyWith(
          status: SessaoAtivaStatus.error,
          errorCode: resumoResult.getLeft().toNullable()!.code,
        ),
      );
      return;
    }

    final movementsResult = await _listarMovimentacoes(sessaoId);
    if (movementsResult.isLeft()) {
      emit(
        state.copyWith(
          status: SessaoAtivaStatus.error,
          errorCode: movementsResult.getLeft().toNullable()!.code,
        ),
      );
      return;
    }

    emit(
      state.copyWith(
        status: SessaoAtivaStatus.loaded,
        resumo: resumoResult.getRight().toNullable(),
        movimentacoes: movementsResult.getRight().toNullable(),
      ),
    );
  }

  Future<void> registrarSangria({
    required String sessaoId,
    required int valorCents,
    required String observacao,
  }) async {
    emit(state.copyWith(opStatus: CashOpStatus.submitting));
    final result = await _registrarSangria(
      sessaoId: sessaoId,
      valorCents: valorCents,
      observacao: observacao,
    );
    await _afterOp(result.isRight(), result.getLeft().toNullable()?.code, sessaoId);
  }

  Future<void> registrarSuprimento({
    required String sessaoId,
    required int valorCents,
    required String observacao,
  }) async {
    emit(state.copyWith(opStatus: CashOpStatus.submitting));
    final result = await _registrarSuprimento(
      sessaoId: sessaoId,
      valorCents: valorCents,
      observacao: observacao,
    );
    await _afterOp(result.isRight(), result.getLeft().toNullable()?.code, sessaoId);
  }

  Future<void> _afterOp(bool success, String? errorCode, String sessaoId) async {
    if (success) {
      emit(state.copyWith(opStatus: CashOpStatus.success));
      await load(sessaoId);
    } else {
      emit(
        state.copyWith(opStatus: CashOpStatus.failure, opErrorCode: errorCode),
      );
    }
  }
}
