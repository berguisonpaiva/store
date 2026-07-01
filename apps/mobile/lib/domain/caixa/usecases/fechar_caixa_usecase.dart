import 'package:fpdart/fpdart.dart';

import '../entities/sessao_caixa_entity.dart';
import '../errors/caixa_failure.dart';
import '../repositories/caixa_repository.dart';

/// Closes a cash session. Rejects a negative counted amount before hitting the
/// backend (`valorFechamento >= 0`).
class FecharCaixaUseCase {
  const FecharCaixaUseCase(this._repository);

  final CaixaRepository _repository;

  Future<Either<CaixaFailure, SessaoCaixaEntity>> call({
    required String sessaoId,
    required int valorFechamentoCents,
  }) {
    if (valorFechamentoCents < 0) {
      return Future.value(left(const InvalidCashAmountFailure()));
    }
    return _repository.fechar(
      sessaoId: sessaoId,
      valorFechamentoCents: valorFechamentoCents,
    );
  }
}
