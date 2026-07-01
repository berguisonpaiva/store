import 'package:fpdart/fpdart.dart';

import '../entities/low_stock_item_entity.dart';
import '../entities/stock_balance_entity.dart';
import '../entities/stock_movement_reason.dart';
import '../entities/stock_movements_page_entity.dart';
import '../errors/inventory_failure.dart';

/// Inventory contract owned by the domain. Implemented in `data` against the
/// backend `/api/inventory` endpoints, all keyed by `variacaoId`. Business
/// outcomes are returned as `Either<InventoryFailure, T>`.
abstract interface class InventoryRepository {
  /// `GET /api/inventory/variations/:variacaoId/balance`.
  Future<Either<InventoryFailure, StockBalanceEntity>> consultarSaldo(
    String variacaoId,
  );

  /// `GET /api/inventory/variations/:variacaoId/movements` with pagination and
  /// an optional `[from, to]` period filter.
  Future<Either<InventoryFailure, StockMovementsPageEntity>> listarMovimentacoes({
    required String variacaoId,
    int page,
    int pageSize,
    DateTime? from,
    DateTime? to,
  });

  /// `GET /api/inventory/low-stock`.
  Future<Either<InventoryFailure, List<LowStockItemEntity>>> listarAbaixoDoMinimo();

  /// `POST /api/inventory/entries` (motivo COMPRA/DEVOLUCAO/AJUSTE).
  Future<Either<InventoryFailure, Unit>> registrarEntrada({
    required String variacaoId,
    required int quantidade,
    required StockMovementReason motivo,
  });

  /// `POST /api/inventory/exits` (motivo PERDA/AJUSTE).
  Future<Either<InventoryFailure, Unit>> registrarSaida({
    required String variacaoId,
    required int quantidade,
    required StockMovementReason motivo,
  });

  /// `POST /api/inventory/adjustments` — sets the absolute counted balance.
  Future<Either<InventoryFailure, Unit>> ajustarSaldo({
    required String variacaoId,
    required int novoSaldo,
    required String observacao,
  });
}
