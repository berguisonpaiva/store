import 'package:fpdart/fpdart.dart';

import '../entities/sessao_caixa_entity.dart';
import '../errors/caixa_failure.dart';
import '../repositories/caixa_repository.dart';

/// Opens a new cash session. Rejects a negative opening float before hitting the
/// backend (`valorAbertura >= 0`).
class AbrirCaixaUseCase {
  const AbrirCaixaUseCase(this._repository);

  final CaixaRepository _repository;

  Future<Either<CaixaFailure, SessaoCaixaEntity>> call({
    required int valorAberturaCents,
  }) {
    if (valorAberturaCents < 0) {
      return Future.value(left(const InvalidCashAmountFailure()));
    }
    return _repository.abrir(valorAberturaCents: valorAberturaCents);
  }
}
