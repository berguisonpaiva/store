import 'package:fpdart/fpdart.dart';

import '../entities/stock_movement_reason.dart';
import '../errors/inventory_failure.dart';
import '../repositories/inventory_repository.dart';

/// Registers a manual stock exit. Rejects non-positive quantities before
/// hitting the backend.
class RegisterExitUseCase {
  const RegisterExitUseCase(this._repository);

  final InventoryRepository _repository;

  Future<Either<InventoryFailure, Unit>> call({
    required String variacaoId,
    required int quantidade,
    required StockMovementReason motivo,
  }) {
    if (quantidade <= 0) {
      return Future.value(left(const InvalidQuantityFailure()));
    }
    return _repository.registrarSaida(
      variacaoId: variacaoId,
      quantidade: quantidade,
      motivo: motivo,
    );
  }
}
