import 'package:fpdart/fpdart.dart';

import '../entities/sessao_caixa_entity.dart';
import '../errors/caixa_failure.dart';
import '../repositories/caixa_repository.dart';

/// Fetches the operator's currently open session, or `null` when there is none.
class ObterCaixaAbertoUseCase {
  const ObterCaixaAbertoUseCase(this._repository);

  final CaixaRepository _repository;

  Future<Either<CaixaFailure, SessaoCaixaEntity?>> call() =>
      _repository.obterCaixaAberto();
}
