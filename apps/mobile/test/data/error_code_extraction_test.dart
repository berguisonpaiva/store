import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/errors/app_exception.dart';
import 'package:mobile/core/network/http_client.dart';
import 'package:mobile/data/caixa/datasources/caixa_remote_data_source_impl.dart';
import 'package:mobile/data/caixa/datasources/cash_session_exception.dart';
import 'package:mobile/data/vendas/datasources/sale_exception.dart';
import 'package:mobile/data/vendas/datasources/vendas_remote_data_source_impl.dart';
import 'package:mocktail/mocktail.dart';

class _MockHttpClient extends Mock implements HttpClient {}

/// The API's global exception filter shapes every failure body as
/// `{ statusCode, error: "<ExceptionName>", message: ["<CODE>"], ... }`. These
/// tests assert the data sources pull the stable domain code out of `message[0]`
/// (not `error`, which holds the NestJS exception name).
DioException _dioWith({required int status, required String code}) {
  final options = RequestOptions(path: '/x');
  return DioException(
    requestOptions: options,
    response: Response(
      requestOptions: options,
      statusCode: status,
      data: {
        'statusCode': status,
        'error': 'ConflictException',
        'message': [code],
        'path': '/x',
        'timestamp': '2026-07-01T00:00:00.000Z',
      },
    ),
  );
}

void main() {
  late _MockHttpClient http;

  setUp(() {
    http = _MockHttpClient();
  });

  test('caixa data source extracts CAIXA_JA_ABERTO from message[0]', () async {
    when(() => http.post(any(), body: any(named: 'body'))).thenThrow(
      NetworkException(
        'conflict',
        statusCode: 409,
        cause: _dioWith(status: 409, code: 'CAIXA_JA_ABERTO'),
      ),
    );
    final ds = CaixaRemoteDataSourceImpl(http);

    await expectLater(
      ds.abrir(valorAbertura: 10),
      throwsA(
        isA<CashSessionException>().having(
          (e) => e.code,
          'code',
          'CAIXA_JA_ABERTO',
        ),
      ),
    );
  });

  test('vendas data source extracts PAYMENT_MISMATCH from message[0]', () async {
    when(() => http.post(any(), body: any(named: 'body'))).thenThrow(
      NetworkException(
        'unprocessable',
        statusCode: 422,
        cause: _dioWith(status: 422, code: 'PAYMENT_MISMATCH'),
      ),
    );
    final ds = VendasRemoteDataSourceImpl(http);

    await expectLater(
      ds.finalizar(vendaId: 'v1', pagamentos: const []),
      throwsA(
        isA<SaleException>().having(
          (e) => e.code,
          'code',
          'PAYMENT_MISMATCH',
        ),
      ),
    );
  });
}
