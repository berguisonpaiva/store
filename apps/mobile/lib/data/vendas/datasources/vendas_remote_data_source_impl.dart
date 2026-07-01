import 'package:dio/dio.dart';

import '../../../core/errors/app_exception.dart';
import '../../../core/network/http_client.dart';
import '../dtos/resumo_vendas_dto.dart';
import '../dtos/venda_dto.dart';
import 'sale_exception.dart';
import 'vendas_remote_data_source.dart';

/// Talks to the backend `/vendas` endpoints via [HttpClient].
///
/// On a transport error it inspects the backend response body for the stable
/// error `code` and rethrows a [SaleException] carrying it, so the repository
/// can map distinct sale errors that share an HTTP status (e.g. the three 422
/// codes).
class VendasRemoteDataSourceImpl implements VendasRemoteDataSource {
  const VendasRemoteDataSourceImpl(this._http);

  final HttpClient _http;

  @override
  Future<VendaDto> criar() => _guard(() async {
    final res = await _http.post('/vendas', body: const <String, dynamic>{});
    return _parseVenda(res.data);
  });

  @override
  Future<VendaDto> adicionarItem({
    required String vendaId,
    String? variacaoId,
    String? sku,
    String? codigoBarras,
    required int quantidade,
  }) => _guard(() async {
    final body = <String, dynamic>{'quantidade': quantidade};
    if (variacaoId != null) body['variacaoId'] = variacaoId;
    if (sku != null) body['sku'] = sku;
    if (codigoBarras != null) body['codigoBarras'] = codigoBarras;
    final res = await _http.post('/vendas/$vendaId/itens', body: body);
    return _parseVenda(res.data);
  });

  @override
  Future<VendaDto> removerItem({
    required String vendaId,
    required String itemId,
  }) => _guard(() async {
    final res = await _http.delete('/vendas/$vendaId/itens/$itemId');
    return _parseVenda(res.data);
  });

  @override
  Future<VendaDto> aplicarDesconto({
    required String vendaId,
    required String tipo,
    required num valor,
  }) => _guard(() async {
    final res = await _http.patch(
      '/vendas/$vendaId/desconto',
      body: {'tipo': tipo, 'valor': valor},
    );
    return _parseVenda(res.data);
  });

  @override
  Future<VendaDto> finalizar({
    required String vendaId,
    required List<Map<String, dynamic>> pagamentos,
  }) => _guard(() async {
    final res = await _http.post(
      '/vendas/$vendaId/finalizar',
      body: {'pagamentos': pagamentos},
    );
    return _parseVenda(res.data);
  });

  @override
  Future<VendaDto> cancelar(String vendaId) => _guard(() async {
    final res = await _http.post('/vendas/$vendaId/cancelar');
    return _parseVenda(res.data);
  });

  @override
  Future<VendaDto> buscar(String vendaId) => _guard(() async {
    final res = await _http.get('/vendas/$vendaId');
    return _parseVenda(res.data);
  });

  @override
  Future<List<VendaDto>> listar(Map<String, dynamic> query) => _guard(() async {
    final res = await _http.get('/vendas', query: query);
    final data = res.data;
    // Accept either a bare list or a paginated `{ data: [...] }` envelope.
    final list = data is Map<String, dynamic> ? data['data'] : data;
    try {
      return (list as List<dynamic>)
          .map((e) => VendaDto.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      throw SerializationException('Invalid vendas payload', cause: e);
    }
  });

  @override
  Future<ResumoVendasDto> resumo(Map<String, dynamic> query) =>
      _guard(() async {
        final res = await _http.get('/vendas/resumo', query: query);
        try {
          return ResumoVendasDto.fromJson(res.data as Map<String, dynamic>);
        } catch (e) {
          throw SerializationException('Invalid resumo payload', cause: e);
        }
      });

  VendaDto _parseVenda(dynamic data) {
    try {
      return VendaDto.fromJson(data as Map<String, dynamic>);
    } catch (e) {
      throw SerializationException('Invalid venda payload', cause: e);
    }
  }

  /// Runs [run]; on a [NetworkException] extracts the backend error `code` from
  /// the response body and rethrows a [SaleException].
  Future<T> _guard<T>(Future<T> Function() run) async {
    try {
      return await run();
    } on NetworkException catch (e) {
      throw SaleException(
        e.message,
        code: _extractCode(e.cause),
        statusCode: e.statusCode,
      );
    }
  }

  /// Best-effort extraction of the backend `code` from a Dio error body such as
  /// `{ "code": "PAYMENT_MISMATCH", ... }`.
  String? _extractCode(Object? cause) {
    if (cause is DioException) {
      final body = cause.response?.data;
      if (body is Map) {
        final code = body['code'] ?? body['error'];
        if (code is String) return code;
      }
    }
    return null;
  }
}
