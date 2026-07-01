/// Technical exception raised by the cash-session remote data source that
/// carries the backend's stable error `code` string, so the repository can map
/// it to the matching domain failure regardless of the HTTP status.
///
/// It does not extend the sealed `AppException` (different library); the
/// repository handles it explicitly alongside `AppException`.
class CashSessionException implements Exception {
  const CashSessionException(this.message, {this.code, this.statusCode});

  final String message;

  /// Backend error code, e.g. `CASH_SESSION_ALREADY_OPEN`.
  final String? code;
  final int? statusCode;

  @override
  String toString() => 'CashSessionException($code, $statusCode): $message';
}
