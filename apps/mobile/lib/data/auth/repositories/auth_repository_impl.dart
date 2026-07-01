import 'package:fpdart/fpdart.dart';

import '../../../core/auth/jwt_decoder.dart';
import '../../../core/errors/app_exception.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../domain/auth/entities/auth_session_entity.dart';
import '../../../domain/auth/entities/auth_user_entity.dart';
import '../../../domain/auth/errors/auth_failure.dart';
import '../../../domain/auth/repositories/auth_repository.dart';
import '../datasources/auth_remote_data_source.dart';

/// Default [AuthRepository]. Persists tokens in secure storage, derives the
/// user by decoding the access token, and converts technical [AppException]s at
/// the boundary into domain [AuthFailure]s. `signOut` is local-only.
class AuthRepositoryImpl implements AuthRepository {
  AuthRepositoryImpl({
    required AuthRemoteDataSource remote,
    required SecureStorage storage,
    required JwtDecoder jwtDecoder,
  }) : _remote = remote,
       _storage = storage,
       _jwtDecoder = jwtDecoder;

  final AuthRemoteDataSource _remote;
  final SecureStorage _storage;
  final JwtDecoder _jwtDecoder;

  static const _accessKey = 'auth.access_token';
  static const _refreshKey = 'auth.refresh_token';

  @override
  Future<Either<AuthFailure, AuthSessionEntity>> signIn({
    required String email,
    required String password,
  }) async {
    try {
      final dto = await _remote.login(email: email, password: password);
      await _persist(dto.accessToken, dto.refreshToken);
      return right(
        AuthSessionEntity(
          accessToken: dto.accessToken,
          refreshToken: dto.refreshToken,
          user: _userFromToken(dto.accessToken),
        ),
      );
    } on AppException catch (e) {
      return left(_toFailure(e));
    } on FormatException {
      return left(const AuthNetworkFailure());
    }
  }

  @override
  Future<Either<AuthFailure, AuthSessionEntity>> refresh() async {
    try {
      final stored = await _storage.read(_refreshKey);
      if (stored == null) return left(const SessionExpiredFailure());
      final dto = await _remote.refresh(stored);
      await _persist(dto.accessToken, dto.refreshToken);
      return right(
        AuthSessionEntity(
          accessToken: dto.accessToken,
          refreshToken: dto.refreshToken,
          user: _userFromToken(dto.accessToken),
        ),
      );
    } on AppException catch (e) {
      return left(_toFailure(e));
    } on FormatException {
      return left(const SessionExpiredFailure());
    }
  }

  @override
  Future<Either<AuthFailure, Unit>> signOut() async {
    await _storage.delete(_accessKey);
    await _storage.delete(_refreshKey);
    return right(unit);
  }

  @override
  Future<Either<AuthFailure, AuthUserEntity>> getProfile() async {
    final access = await _storage.read(_accessKey);
    if (access == null) return left(const SessionExpiredFailure());
    try {
      return right(_userFromToken(access));
    } on FormatException {
      return left(const SessionExpiredFailure());
    }
  }

  @override
  Future<Option<AuthSessionEntity>> currentSession() async {
    final access = await _storage.read(_accessKey);
    final refresh = await _storage.read(_refreshKey);
    if (access == null || refresh == null) return none();
    try {
      return some(
        AuthSessionEntity(
          accessToken: access,
          refreshToken: refresh,
          user: _userFromToken(access),
        ),
      );
    } on FormatException {
      return none();
    }
  }

  AuthUserEntity _userFromToken(String accessToken) {
    final claims = _jwtDecoder.decode(accessToken);
    return AuthUserEntity(
      id: (claims['sub'] ?? '') as String,
      name: (claims['name'] ?? '') as String,
      email: (claims['email'] ?? '') as String,
      role: claims['role'] as String?,
    );
  }

  Future<void> _persist(String access, String refresh) async {
    await _storage.write(_accessKey, access);
    await _storage.write(_refreshKey, refresh);
  }

  AuthFailure _toFailure(AppException e) {
    return switch (e) {
      UnauthorizedException() => const InvalidCredentialsFailure(),
      NetworkException() => const AuthNetworkFailure(),
      _ => const AuthNetworkFailure(),
    };
  }
}
