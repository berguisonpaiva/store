import 'package:fpdart/fpdart.dart';

import '../entities/stock_movements_page_entity.dart';
import '../errors/inventory_failure.dart';
import '../repositories/inventory_repository.dart';

/// Lists ledger movements for a variation, with pagination and a period filter.
class ListMovementsUseCase {
  const ListMovementsUseCase(this._repository);

  final InventoryRepository _repository;

  Future<Either<InventoryFailure, StockMovementsPageEntity>> call({
    required String variacaoId,
    int page = 1,
    int pageSize = 20,
    DateTime? from,
    DateTime? to,
  }) => _repository.listarMovimentacoes(
    variacaoId: variacaoId,
    page: page,
    pageSize: pageSize,
    from: from,
    to: to,
  );
}
