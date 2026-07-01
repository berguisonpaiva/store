/// Technical exception raised by the sales remote data source that carries the
/// backend's stable error `code` string, so the repository can map it to the
/// matching domain failure regardless of the HTTP status.
///
/// It does not extend the sealed `AppException` (different library); the
/// repository handles it explicitly alongside `AppException`.
class SaleException implements Exception {
  const SaleException(this.message, {this.code, this.statusCode});

  final String message;

  /// Backend error code, e.g. `SALE_NOT_FOUND`, `PAYMENT_MISMATCH`.
  final String? code;
  final int? statusCode;

  @override
  String toString() => 'SaleException($code, $statusCode): $message';
}
