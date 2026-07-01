import 'package:fpdart/fpdart.dart';

import '../entities/resumo_sessao_entity.dart';
import '../errors/caixa_failure.dart';
import '../repositories/caixa_repository.dart';

/// Fetches the aggregated totals (abertura, suprimentos, vendas, sangrias,
/// esperado, contado, divergencia) for a session.
class ObterResumoSessaoUseCase {
  const ObterResumoSessaoUseCase(this._repository);

  final CaixaRepository _repository;

  Future<Either<CaixaFailure, ResumoSessaoEntity>> call(String sessaoId) =>
      _repository.obterResumo(sessaoId);
}
