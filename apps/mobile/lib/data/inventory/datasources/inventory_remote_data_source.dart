import '../dtos/low_stock_item_dto.dart';
import '../dtos/stock_balance_dto.dart';
import '../dtos/stock_movements_page_dto.dart';

/// Remote calls against the backend `/api/inventory` endpoints. Throws
/// technical `AppException`s; the repository converts them into failures.
abstract interface class InventoryRemoteDataSource {
  Future<StockBalanceDto> getBalance(String variacaoId);

  Future<StockMovementsPageDto> listMovements({
    required String variacaoId,
    required int page,
    required int pageSize,
    DateTime? from,
    DateTime? to,
  });

  Future<List<LowStockItemDto>> listLowStock();

  Future<void> registerEntry({
    required String variacaoId,
    required int quantidade,
    required String motivo,
  });

  Future<void> registerExit({
    required String variacaoId,
    required int quantidade,
    required String motivo,
  });

  Future<void> adjustBalance({
    required String variacaoId,
    required int novoSaldo,
    required String observacao,
  });
}
