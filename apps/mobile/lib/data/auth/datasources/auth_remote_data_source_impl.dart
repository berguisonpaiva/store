import '../../../core/errors/app_exception.dart';
import '../../../core/network/http_client.dart';
import '../dtos/auth_session_dto.dart';
import 'auth_remote_data_source.dart';

/// Talks to the backend `/api/auth/login` and `/api/auth/refresh` via
/// [HttpClient].
class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  const AuthRemoteDataSourceImpl(this._http);

  final HttpClient _http;

  @override
  Future<AuthSessionDto> login({
    required String email,
    required String password,
  }) async {
    final res = await _http.post(
      '/api/auth/login',
      body: {'email': email, 'password': password},
    );
    try {
      return AuthSessionDto.fromLogin(res.data as Map<String, dynamic>);
    } catch (e) {
      throw SerializationException('Invalid login payload', cause: e);
    }
  }

  @override
  Future<AuthSessionDto> refresh(String refreshToken) async {
    final res = await _http.post(
      '/api/auth/refresh',
      body: {'refreshToken': refreshToken},
    );
    try {
      return AuthSessionDto.fromRefresh(
        res.data as Map<String, dynamic>,
        refreshToken,
      );
    } catch (e) {
      throw SerializationException('Invalid refresh payload', cause: e);
    }
  }
}
