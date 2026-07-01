import 'package:fpdart/fpdart.dart';

import '../errors/inventory_failure.dart';
import '../repositories/inventory_repository.dart';

/// Adjusts the balance of a variation to an absolute counted value. Rejects a
/// negative target before hitting the backend; the justification is required.
class AdjustBalanceUseCase {
  const AdjustBalanceUseCase(this._repository);

  final InventoryRepository _repository;

  Future<Either<InventoryFailure, Unit>> call({
    required String variacaoId,
    required int novoSaldo,
    required String observacao,
  }) {
    if (novoSaldo < 0) {
      return Future.value(left(const InvalidQuantityFailure()));
    }
    return _repository.ajustarSaldo(
      variacaoId: variacaoId,
      novoSaldo: novoSaldo,
      observacao: observacao,
    );
  }
}
