/// Generic HTTP client interface. The `data` layer depends on this, never on a
/// concrete transport package (dio), keeping transport details swappable.
abstract interface class HttpClient {
  Future<HttpResponse> get(String path, {Map<String, dynamic>? query});

  Future<HttpResponse> post(String path, {Object? body});

  Future<HttpResponse> put(String path, {Object? body});

  Future<HttpResponse> patch(String path, {Object? body});

  Future<HttpResponse> delete(String path, {Object? body});

  /// Sets (or clears, when null) the bearer token sent on every request.
  void setAuthToken(String? token);

  /// Wires automatic recovery on `401`: [onRefresh] returns a new access token
  /// (or null on failure) and the original request is retried once;
  /// [onAuthFailure] is invoked when refresh fails. Callbacks keep `core`
  /// decoupled from `app`/`domain`.
  void configureAuth({
    required Future<String?> Function() onRefresh,
    required Future<void> Function() onAuthFailure,
  });
}

/// Transport-agnostic response.
class HttpResponse {
  const HttpResponse({required this.statusCode, required this.data});

  final int statusCode;
  final dynamic data;
}
