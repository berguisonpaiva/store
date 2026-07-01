import 'package:fpdart/fpdart.dart';

import '../entities/stock_balance_entity.dart';
import '../errors/inventory_failure.dart';
import '../repositories/inventory_repository.dart';

/// Fetches the current/available balance for a variation.
class GetBalanceUseCase {
  const GetBalanceUseCase(this._repository);

  final InventoryRepository _repository;

  Future<Either<InventoryFailure, StockBalanceEntity>> call(String variacaoId) =>
      _repository.consultarSaldo(variacaoId);
}
