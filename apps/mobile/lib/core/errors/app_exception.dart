/// Technical/infrastructure exceptions thrown by the `core` and `data` layers.
///
/// These are NOT business errors. Repository implementations catch them at the
/// boundary and convert them into domain `Failure`s.
sealed class AppException implements Exception {
  const AppException(this.message, {this.cause});

  final String message;
  final Object? cause;

  @override
  String toString() => '$runtimeType: $message';
}

/// Any network/transport level error (timeouts, connectivity, non-2xx, etc.).
class NetworkException extends AppException {
  const NetworkException(super.message, {this.statusCode, super.cause});

  final int? statusCode;
}

/// The server responded but the payload could not be parsed/decoded.
class SerializationException extends AppException {
  const SerializationException(super.message, {super.cause});
}

/// A local persistence/storage operation failed.
class StorageException extends AppException {
  const StorageException(super.message, {super.cause});
}

/// Authentication transport error (401/403 from the API).
class UnauthorizedException extends AppException {
  const UnauthorizedException(super.message, {super.cause});
}
