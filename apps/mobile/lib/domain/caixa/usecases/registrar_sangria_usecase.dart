import 'package:fpdart/fpdart.dart';

import '../entities/movimentacao_caixa_entity.dart';
import '../errors/caixa_failure.dart';
import '../repositories/caixa_repository.dart';

/// Registers a cash withdrawal (sangria). Requires a positive amount and a
/// non-empty observation before hitting the backend.
class RegistrarSangriaUseCase {
  const RegistrarSangriaUseCase(this._repository);

  final CaixaRepository _repository;

  Future<Either<CaixaFailure, MovimentacaoCaixaEntity>> call({
    required String sessaoId,
    required int valorCents,
    required String observacao,
  }) {
    if (valorCents <= 0 || observacao.trim().isEmpty) {
      return Future.value(left(const InvalidCashAmountFailure()));
    }
    return _repository.registrarSangria(
      sessaoId: sessaoId,
      valorCents: valorCents,
      observacao: observacao.trim(),
    );
  }
}
