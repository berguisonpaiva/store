import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/errors/app_exception.dart';
import 'package:mobile/core/network/http_client_impl.dart';

/// Adapter that returns 401 on the first call and 200 afterwards, simulating an
/// expired token followed by a successful retry.
class _FlakyAdapter implements HttpClientAdapter {
  int calls = 0;
  bool always401 = false;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<List<int>>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    calls++;
    final unauthorized = always401 || calls == 1;
    return ResponseBody.fromString(
      unauthorized ? '{"error":"unauthorized"}' : '{"ok":true}',
      unauthorized ? 401 : 200,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

void main() {
  test('401 triggers a single refresh + retry, then succeeds', () async {
    final dio = Dio()..httpClientAdapter = _FlakyAdapter();
    final client = HttpClientImpl(baseUrl: 'http://localhost', dio: dio);
    var refreshed = false;

    client.configureAuth(
      onRefresh: () async {
        refreshed = true;
        return 'new-access-token';
      },
      onAuthFailure: () async {},
    );

    final res = await client.get('/protected');

    expect(refreshed, isTrue);
    expect(res.statusCode, 200);
  });

  test('refresh failure surfaces as UnauthorizedException', () async {
    final adapter = _FlakyAdapter()..always401 = true;
    final dio = Dio()..httpClientAdapter = adapter;
    final client = HttpClientImpl(baseUrl: 'http://localhost', dio: dio);
    var authFailed = false;

    client.configureAuth(
      onRefresh: () async => null,
      onAuthFailure: () async => authFailed = true,
    );

    await expectLater(
      client.get('/protected'),
      throwsA(isA<UnauthorizedException>()),
    );
    expect(authFailed, isTrue);
  });
}
