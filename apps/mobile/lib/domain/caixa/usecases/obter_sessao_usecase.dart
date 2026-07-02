import 'package:fpdart/fpdart.dart';

import '../entities/sessao_caixa_entity.dart';
import '../errors/caixa_failure.dart';
import '../repositories/caixa_repository.dart';

/// Fetches a single cash session by id. The backend denies reads by anyone but
/// the owner (RN03), surfaced as [CashSessionAccessDeniedFailure].
class ObterSessaoUseCase {
  const ObterSessaoUseCase(this._repository);

  final CaixaRepository _repository;

  Future<Either<CaixaFailure, SessaoCaixaEntity>> call(String sessaoId) =>
      _repository.obterSessao(sessaoId);
}
