import '../../../core/errors/app_exception.dart';
import '../../../core/network/http_client.dart';
import '../dtos/low_stock_item_dto.dart';
import '../dtos/stock_balance_dto.dart';
import '../dtos/stock_movements_page_dto.dart';
import 'inventory_remote_data_source.dart';

/// Talks to the backend `/api/inventory` endpoints (all keyed by `variacaoId`)
/// via [HttpClient].
class InventoryRemoteDataSourceImpl implements InventoryRemoteDataSource {
  const InventoryRemoteDataSourceImpl(this._http);

  final HttpClient _http;

  @override
  Future<StockBalanceDto> getBalance(String variacaoId) async {
    final res = await _http.get('/api/inventory/variations/$variacaoId/balance');
    try {
      return StockBalanceDto.fromJson(res.data as Map<String, dynamic>);
    } catch (e) {
      throw SerializationException('Invalid balance payload', cause: e);
    }
  }

  @override
  Future<StockMovementsPageDto> listMovements({
    required String variacaoId,
    required int page,
    required int pageSize,
    DateTime? from,
    DateTime? to,
  }) async {
    final res = await _http.get(
      '/api/inventory/variations/$variacaoId/movements',
      query: {
        'page': page,
        'pageSize': pageSize,
        if (from != null) 'from': from.toUtc().toIso8601String(),
        if (to != null) 'to': to.toUtc().toIso8601String(),
      },
    );
    try {
      return StockMovementsPageDto.fromJson(res.data as Map<String, dynamic>);
    } catch (e) {
      throw SerializationException('Invalid movements payload', cause: e);
    }
  }

  @override
  Future<List<LowStockItemDto>> listLowStock() async {
    final res = await _http.get('/api/inventory/low-stock');
    try {
      return (res.data as List<dynamic>)
          .map((e) => LowStockItemDto.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      throw SerializationException('Invalid low-stock payload', cause: e);
    }
  }

  @override
  Future<void> registerEntry({
    required String variacaoId,
    required int quantidade,
    required String motivo,
  }) async {
    await _http.post(
      '/api/inventory/entries',
      body: {
        'variacaoId': variacaoId,
        'quantidade': quantidade,
        'motivo': motivo,
      },
    );
  }

  @override
  Future<void> registerExit({
    required String variacaoId,
    required int quantidade,
    required String motivo,
  }) async {
    await _http.post(
      '/api/inventory/exits',
      body: {
        'variacaoId': variacaoId,
        'quantidade': quantidade,
        'motivo': motivo,
      },
    );
  }

  @override
  Future<void> adjustBalance({
    required String variacaoId,
    required int novoSaldo,
    required String observacao,
  }) async {
    await _http.post(
      '/api/inventory/adjustments',
      body: {
        'variacaoId': variacaoId,
        'novoSaldo': novoSaldo,
        'observacao': observacao,
      },
    );
  }
}
