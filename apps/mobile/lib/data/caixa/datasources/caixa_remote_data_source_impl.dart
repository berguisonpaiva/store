import 'package:dio/dio.dart';

import '../../../core/errors/app_exception.dart';
import '../../../core/network/http_client.dart';
import '../dtos/movimentacao_caixa_dto.dart';
import '../dtos/resumo_sessao_dto.dart';
import '../dtos/sessao_caixa_dto.dart';
import 'caixa_remote_data_source.dart';
import 'cash_session_exception.dart';

/// Talks to the backend `/caixa/*` endpoints via [HttpClient].
///
/// On a transport error it inspects the backend response body for the stable
/// error `code` and rethrows a [CashSessionException] carrying it, so the
/// repository can map distinct cash errors that share an HTTP status.
class CaixaRemoteDataSourceImpl implements CaixaRemoteDataSource {
  const CaixaRemoteDataSourceImpl(this._http);

  final HttpClient _http;

  @override
  Future<SessaoCaixaDto> abrir({required double valorAbertura}) =>
      _guard(() async {
        final res = await _http.post(
          '/caixa/abrir',
          body: {'valorAbertura': valorAbertura},
        );
        return _parseSession(res.data);
      });

  @override
  Future<SessaoCaixaDto> fechar({
    required String sessaoId,
    required double valorFechamento,
  }) => _guard(() async {
    final res = await _http.post(
      '/caixa/$sessaoId/fechar',
      body: {'valorFechamento': valorFechamento},
    );
    return _parseSession(res.data);
  });

  @override
  Future<MovimentacaoCaixaDto> sangria({
    required String sessaoId,
    required double valor,
    required String observacao,
  }) => _guard(() async {
    final res = await _http.post(
      '/caixa/$sessaoId/sangria',
      body: {'valor': valor, 'observacao': observacao},
    );
    return _parseMovement(res.data);
  });

  @override
  Future<MovimentacaoCaixaDto> suprimento({
    required String sessaoId,
    required double valor,
    required String observacao,
  }) => _guard(() async {
    final res = await _http.post(
      '/caixa/$sessaoId/suprimento',
      body: {'valor': valor, 'observacao': observacao},
    );
    return _parseMovement(res.data);
  });

  @override
  Future<SessaoCaixaDto?> getAberto() => _guard(() async {
    final res = await _http.get('/caixa/aberto');
    final data = res.data;
    // An empty body / null / empty object means "no open session".
    if (data == null) return null;
    if (data is Map<String, dynamic>) {
      if (data.isEmpty || data['id'] == null) return null;
      return SessaoCaixaDto.fromJson(data);
    }
    return null;
  });

  @override
  Future<ResumoSessaoDto> getResumo(String sessaoId) => _guard(() async {
    final res = await _http.get('/caixa/$sessaoId/resumo');
    try {
      return ResumoSessaoDto.fromJson(res.data as Map<String, dynamic>);
    } catch (e) {
      throw SerializationException('Invalid resumo payload', cause: e);
    }
  });

  @override
  Future<List<MovimentacaoCaixaDto>> listMovimentacoes(String sessaoId) =>
      _guard(() async {
        final res = await _http.get('/caixa/$sessaoId/movimentacoes');
        try {
          return (res.data as List<dynamic>)
              .map(
                (e) => MovimentacaoCaixaDto.fromJson(e as Map<String, dynamic>),
              )
              .toList();
        } catch (e) {
          throw SerializationException('Invalid movimentacoes payload', cause: e);
        }
      });

  SessaoCaixaDto _parseSession(dynamic data) {
    try {
      return SessaoCaixaDto.fromJson(data as Map<String, dynamic>);
    } catch (e) {
      throw SerializationException('Invalid session payload', cause: e);
    }
  }

  MovimentacaoCaixaDto _parseMovement(dynamic data) {
    try {
      return MovimentacaoCaixaDto.fromJson(data as Map<String, dynamic>);
    } catch (e) {
      throw SerializationException('Invalid movement payload', cause: e);
    }
  }

  /// Runs [run]; on a [NetworkException] extracts the backend error `code` from
  /// the response body and rethrows a [CashSessionException].
  Future<T> _guard<T>(Future<T> Function() run) async {
    try {
      return await run();
    } on NetworkException catch (e) {
      throw CashSessionException(
        e.message,
        code: _extractCode(e.cause),
        statusCode: e.statusCode,
      );
    }
  }

  /// Best-effort extraction of the backend `code` from a Dio error body such as
  /// `{ "code": "CASH_SESSION_ALREADY_OPEN", ... }`.
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
