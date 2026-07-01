import 'package:dio/dio.dart';

import '../errors/app_exception.dart';
import 'http_client.dart';

/// Dio-backed [HttpClient]. Owns base URL, timeouts and bearer-token injection,
/// and translates transport failures into technical [AppException]s.
class HttpClientImpl implements HttpClient {
  HttpClientImpl({required String baseUrl, Dio? dio})
    : _dio = (dio ?? Dio())
        ..options.baseUrl = baseUrl
        ..options.connectTimeout = const Duration(seconds: 15)
        ..options.receiveTimeout = const Duration(seconds: 20);

  final Dio _dio;

  Future<String?> Function()? _onRefresh;
  Future<void> Function()? _onAuthFailure;
  bool _refreshing = false;

  @override
  void setAuthToken(String? token) {
    if (token == null) {
      _dio.options.headers.remove('Authorization');
    } else {
      _dio.options.headers['Authorization'] = 'Bearer $token';
    }
  }

  @override
  void configureAuth({
    required Future<String?> Function() onRefresh,
    required Future<void> Function() onAuthFailure,
  }) {
    _onRefresh = onRefresh;
    _onAuthFailure = onAuthFailure;

    _dio.interceptors.add(
      InterceptorsWrapper(
        onError: (error, handler) async {
          final status = error.response?.statusCode;
          final path = error.requestOptions.path;
          final isAuthRoute = path.contains('/api/auth/');
          final alreadyRetried =
              error.requestOptions.extra['__retried'] == true;

          if (status != 401 ||
              _onRefresh == null ||
              isAuthRoute ||
              alreadyRetried ||
              _refreshing) {
            return handler.next(error);
          }

          _refreshing = true;
          final newToken = await _onRefresh!.call();
          _refreshing = false;

          if (newToken == null) {
            await _onAuthFailure?.call();
            return handler.next(error);
          }

          setAuthToken(newToken);
          final options = error.requestOptions
            ..extra['__retried'] = true
            ..headers['Authorization'] = 'Bearer $newToken';

          try {
            final retried = await _dio.fetch<dynamic>(options);
            return handler.resolve(retried);
          } catch (_) {
            return handler.next(error);
          }
        },
      ),
    );
  }

  @override
  Future<HttpResponse> get(String path, {Map<String, dynamic>? query}) =>
      _send(() => _dio.get(path, queryParameters: query));

  @override
  Future<HttpResponse> post(String path, {Object? body}) =>
      _send(() => _dio.post(path, data: body));

  @override
  Future<HttpResponse> put(String path, {Object? body}) =>
      _send(() => _dio.put(path, data: body));

  @override
  Future<HttpResponse> patch(String path, {Object? body}) =>
      _send(() => _dio.patch(path, data: body));

  @override
  Future<HttpResponse> delete(String path, {Object? body}) =>
      _send(() => _dio.delete(path, data: body));

  Future<HttpResponse> _send(Future<Response<dynamic>> Function() run) async {
    try {
      final response = await run();
      return HttpResponse(
        statusCode: response.statusCode ?? 0,
        data: response.data,
      );
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      if (status == 401 || status == 403) {
        throw UnauthorizedException('Unauthorized', cause: e);
      }
      throw NetworkException(
        e.message ?? 'Network error',
        statusCode: status,
        cause: e,
      );
    }
  }
}
