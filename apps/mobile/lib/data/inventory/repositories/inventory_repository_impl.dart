import 'package:fpdart/fpdart.dart';

import '../../../core/errors/app_exception.dart';
import '../../../domain/inventory/entities/low_stock_item_entity.dart';
import '../../../domain/inventory/entities/stock_balance_entity.dart';
import '../../../domain/inventory/entities/stock_movement_reason.dart';
import '../../../domain/inventory/entities/stock_movements_page_entity.dart';
import '../../../domain/inventory/errors/inventory_failure.dart';
import '../../../domain/inventory/repositories/inventory_repository.dart';
import '../datasources/inventory_remote_data_source.dart';

/// Default [InventoryRepository]. Delegates to the remote data source and
/// converts technical [AppException]s at the boundary into domain
/// [InventoryFailure]s, mapping the backend HTTP status to the matching code
/// (404 → not found, 409 → insufficient stock, 400 → invalid quantity).
class InventoryRepositoryImpl implements InventoryRepository {
  const InventoryRepositoryImpl(this._remote);

  final InventoryRemoteDataSource _remote;

  @override
  Future<Either<InventoryFailure, StockBalanceEntity>> consultarSaldo(
    String variacaoId,
  ) => _guard(() async {
    final dto = await _remote.getBalance(variacaoId);
    return dto.toEntity();
  });

  @override
  Future<Either<InventoryFailure, StockMovementsPageEntity>> listarMovimentacoes({
    required String variacaoId,
    int page = 1,
    int pageSize = 20,
    DateTime? from,
    DateTime? to,
  }) => _guard(() async {
    final dto = await _remote.listMovements(
      variacaoId: variacaoId,
      page: page,
      pageSize: pageSize,
      from: from,
      to: to,
    );
    return dto.toEntity();
  });

  @override
  Future<Either<InventoryFailure, List<LowStockItemEntity>>>
  listarAbaixoDoMinimo() => _guard(() async {
    final dtos = await _remote.listLowStock();
    return dtos.map((e) => e.toEntity()).toList();
  });

  @override
  Future<Either<InventoryFailure, Unit>> registrarEntrada({
    required String variacaoId,
    required int quantidade,
    required StockMovementReason motivo,
  }) => _guard(() async {
    await _remote.registerEntry(
      variacaoId: variacaoId,
      quantidade: quantidade,
      motivo: motivo.wire,
    );
    return unit;
  });

  @override
  Future<Either<InventoryFailure, Unit>> registrarSaida({
    required String variacaoId,
    required int quantidade,
    required StockMovementReason motivo,
  }) => _guard(() async {
    await _remote.registerExit(
      variacaoId: variacaoId,
      quantidade: quantidade,
      motivo: motivo.wire,
    );
    return unit;
  });

  @override
  Future<Either<InventoryFailure, Unit>> ajustarSaldo({
    required String variacaoId,
    required int novoSaldo,
    required String observacao,
  }) => _guard(() async {
    await _remote.adjustBalance(
      variacaoId: variacaoId,
      novoSaldo: novoSaldo,
      observacao: observacao,
    );
    return unit;
  });

  /// Runs [run], converting any [AppException] into the matching failure.
  Future<Either<InventoryFailure, T>> _guard<T>(
    Future<T> Function() run,
  ) async {
    try {
      return right(await run());
    } on AppException catch (e) {
      return left(_toFailure(e));
    }
  }

  InventoryFailure _toFailure(AppException e) {
    if (e is NetworkException) {
      return switch (e.statusCode) {
        404 => const VariationNotFoundFailure(),
        409 => const InsufficientStockFailure(),
        400 => const InvalidQuantityFailure(),
        _ => const InventoryNetworkFailure(),
      };
    }
    return const InventoryNetworkFailure();
  }
}
