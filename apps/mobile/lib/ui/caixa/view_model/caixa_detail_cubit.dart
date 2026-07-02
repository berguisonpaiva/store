import 'package:bloc/bloc.dart';

import '../../../domain/caixa/usecases/listar_movimentacoes_usecase.dart';
import '../../../domain/caixa/usecases/obter_resumo_sessao_usecase.dart';
import '../../../domain/caixa/usecases/obter_sessao_usecase.dart';
import 'caixa_detail_state.dart';

/// Loads a single cash session (data, resumo and movements) for the read-only
/// history detail. The backend denies cross-operator reads (RN03 →
/// `ACESSO_NEGADO`), surfaced as an error. No Flutter imports.
class CaixaDetailCubit extends Cubit<CaixaDetailState> {
  CaixaDetailCubit({
    required ObterSessaoUseCase obterSessao,
    required ObterResumoSessaoUseCase obterResumo,
    required ListarMovimentacoesUseCase listarMovimentacoes,
  }) : _obterSessao = obterSessao,
       _obterResumo = obterResumo,
       _listarMovimentacoes = listarMovimentacoes,
       super(const CaixaDetailState());

  final ObterSessaoUseCase _obterSessao;
  final ObterResumoSessaoUseCase _obterResumo;
  final ListarMovimentacoesUseCase _listarMovimentacoes;

  Future<void> load(String sessaoId) async {
    emit(state.copyWith(status: CaixaDetailStatus.loading));

    final sessaoResult = await _obterSessao(sessaoId);
    if (sessaoResult.isLeft()) {
      emit(
        state.copyWith(
          status: CaixaDetailStatus.error,
          errorCode: sessaoResult.getLeft().toNullable()!.code,
        ),
      );
      return;
    }

    final resumoResult = await _obterResumo(sessaoId);
    if (resumoResult.isLeft()) {
      emit(
        state.copyWith(
          status: CaixaDetailStatus.error,
          errorCode: resumoResult.getLeft().toNullable()!.code,
        ),
      );
      return;
    }

    final movementsResult = await _listarMovimentacoes(sessaoId);
    if (movementsResult.isLeft()) {
      emit(
        state.copyWith(
          status: CaixaDetailStatus.error,
          errorCode: movementsResult.getLeft().toNullable()!.code,
        ),
      );
      return;
    }

    emit(
      state.copyWith(
        status: CaixaDetailStatus.loaded,
        sessao: sessaoResult.getRight().toNullable(),
        resumo: resumoResult.getRight().toNullable(),
        movimentacoes: movementsResult.getRight().toNullable(),
      ),
    );
  }
}
