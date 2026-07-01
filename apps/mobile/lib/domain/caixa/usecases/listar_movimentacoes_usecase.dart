import 'package:fpdart/fpdart.dart';

import '../entities/movimentacao_caixa_entity.dart';
import '../errors/caixa_failure.dart';
import '../repositories/caixa_repository.dart';

/// Lists the movements recorded in a session.
class ListarMovimentacoesUseCase {
  const ListarMovimentacoesUseCase(this._repository);

  final CaixaRepository _repository;

  Future<Either<CaixaFailure, List<MovimentacaoCaixaEntity>>> call(
    String sessaoId,
  ) => _repository.listarMovimentacoes(sessaoId);
}
