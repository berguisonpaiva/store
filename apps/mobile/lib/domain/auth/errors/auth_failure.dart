import '../../errors/failure.dart';

/// Business failures for the authentication context.
sealed class AuthFailure extends Failure {
  const AuthFailure(super.code, {super.message});
}

/// Credentials were rejected by the backend.
class InvalidCredentialsFailure extends AuthFailure {
  const InvalidCredentialsFailure({String? message})
    : super('auth.invalid_credentials', message: message);
}

/// The session expired or no valid token is available.
class SessionExpiredFailure extends AuthFailure {
  const SessionExpiredFailure({String? message})
    : super('auth.session_expired', message: message);
}

/// A network/transport problem prevented the auth operation.
class AuthNetworkFailure extends AuthFailure {
  const AuthNetworkFailure({String? message})
    : super('auth.network', message: message);
}
