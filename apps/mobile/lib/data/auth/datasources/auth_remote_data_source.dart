import '../dtos/auth_session_dto.dart';

/// Remote auth data source. Throws technical [AppException]s on failure; the
/// repository converts them into domain Failures. The backend exposes only
/// `/api/auth/login` and `/api/auth/refresh`.
abstract interface class AuthRemoteDataSource {
  Future<AuthSessionDto> login({
    required String email,
    required String password,
  });

  Future<AuthSessionDto> refresh(String refreshToken);
}
