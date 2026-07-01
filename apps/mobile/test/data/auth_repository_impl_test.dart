import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/auth/jwt_decoder_impl.dart';
import 'package:mobile/core/errors/app_exception.dart';
import 'package:mobile/core/storage/secure_storage.dart';
import 'package:mobile/data/auth/datasources/auth_remote_data_source.dart';
import 'package:mobile/data/auth/dtos/auth_session_dto.dart';
import 'package:mobile/data/auth/repositories/auth_repository_impl.dart';
import 'package:mobile/domain/auth/errors/auth_failure.dart';
import 'package:mocktail/mocktail.dart';

class _MockRemote extends Mock implements AuthRemoteDataSource {}

class _MockStorage extends Mock implements SecureStorage {}

String _fakeJwt(Map<String, dynamic> claims) {
  String seg(Map<String, dynamic> m) =>
      base64Url.encode(utf8.encode(jsonEncode(m))).replaceAll('=', '');
  return '${seg({'alg': 'HS256'})}.${seg(claims)}.sig';
}

void main() {
  late _MockRemote remote;
  late _MockStorage storage;
  late AuthRepositoryImpl repository;

  final token = _fakeJwt({
    'sub': '1',
    'name': 'Ada Lovelace',
    'email': 'ada@store.dev',
    'role': 'ADMIN',
  });

  setUp(() {
    remote = _MockRemote();
    storage = _MockStorage();
    repository = AuthRepositoryImpl(
      remote: remote,
      storage: storage,
      jwtDecoder: const JwtDecoderImpl(),
    );
    when(() => storage.write(any(), any())).thenAnswer((_) async {});
    when(() => storage.delete(any())).thenAnswer((_) async {});
  });

  group('signIn', () {
    test('persists tokens and derives the user from the access token', () async {
      when(
        () => remote.login(
          email: any(named: 'email'),
          password: any(named: 'password'),
        ),
      ).thenAnswer(
        (_) async => AuthSessionDto(accessToken: token, refreshToken: 'r'),
      );

      final result = await repository.signIn(
        email: 'ada@store.dev',
        password: 'pw',
      );

      expect(result.isRight(), isTrue);
      final session = result.getRight().toNullable()!;
      expect(session.user.id, '1');
      expect(session.user.role, 'ADMIN');
      verify(() => storage.write('auth.access_token', token)).called(1);
      verify(() => storage.write('auth.refresh_token', 'r')).called(1);
    });

    test('converts UnauthorizedException into InvalidCredentialsFailure',
        () async {
      when(
        () => remote.login(
          email: any(named: 'email'),
          password: any(named: 'password'),
        ),
      ).thenThrow(const UnauthorizedException('nope'));

      final result = await repository.signIn(email: 'x', password: 'y');

      expect(result.getLeft().toNullable(), isA<InvalidCredentialsFailure>());
    });
  });

  group('signOut', () {
    test('clears tokens locally without calling the backend', () async {
      final result = await repository.signOut();

      expect(result.isRight(), isTrue);
      verify(() => storage.delete('auth.access_token')).called(1);
      verify(() => storage.delete('auth.refresh_token')).called(1);
      verifyNoMoreInteractions(remote);
    });
  });

  group('currentSession', () {
    test('returns some(session) with the token-derived user', () async {
      when(() => storage.read('auth.access_token'))
          .thenAnswer((_) async => token);
      when(() => storage.read('auth.refresh_token'))
          .thenAnswer((_) async => 'r');

      final session = await repository.currentSession();

      expect(session.isSome(), isTrue);
      expect(session.toNullable()!.user.email, 'ada@store.dev');
    });

    test('returns none when no tokens are stored', () async {
      when(() => storage.read(any())).thenAnswer((_) async => null);

      final session = await repository.currentSession();

      expect(session.isNone(), isTrue);
    });
  });
}
