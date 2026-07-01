import 'package:fpdart/fpdart.dart';

import '../entities/low_stock_item_entity.dart';
import '../errors/inventory_failure.dart';
import '../repositories/inventory_repository.dart';

/// Lists variations at or below their minimum stock (replenishment alerts).
class ListLowStockUseCase {
  const ListLowStockUseCase(this._repository);

  final InventoryRepository _repository;

  Future<Either<InventoryFailure, List<LowStockItemEntity>>> call() =>
      _repository.listarAbaixoDoMinimo();
}
