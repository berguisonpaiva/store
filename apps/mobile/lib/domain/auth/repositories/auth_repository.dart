import 'package:fpdart/fpdart.dart';

import '../entities/auth_session_entity.dart';
import '../entities/auth_user_entity.dart';
import '../errors/auth_failure.dart';

/// Authentication contract owned by the domain. Implemented in `data` against
/// the backend, which exposes only `POST /api/auth/login` and
/// `POST /api/auth/refresh`. The authenticated user is derived by decoding the
/// access token. Business outcomes are returned as `Either<AuthFailure, T>`.
abstract interface class AuthRepository {
  /// `POST /api/auth/login` — returns tokens; the user is decoded from the JWT.
  Future<Either<AuthFailure, AuthSessionEntity>> signIn({
    required String email,
    required String password,
  });

  /// `POST /api/auth/refresh` — returns a new access token (refresh kept).
  Future<Either<AuthFailure, AuthSessionEntity>> refresh();

  /// Clears the persisted tokens locally (no backend `/logout` endpoint).
  Future<Either<AuthFailure, Unit>> signOut();

  /// Returns the current user, derived from the stored access token.
  Future<Either<AuthFailure, AuthUserEntity>> getProfile();

  /// Reads the persisted session (if any) without hitting the network.
  Future<Option<AuthSessionEntity>> currentSession();
}
