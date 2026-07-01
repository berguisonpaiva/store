import 'package:flutter_test/flutter_test.dart';
import 'package:fpdart/fpdart.dart';
import 'package:mobile/domain/auth/entities/auth_session_entity.dart';
import 'package:mobile/domain/auth/entities/auth_user_entity.dart';
import 'package:mobile/domain/auth/errors/auth_failure.dart';
import 'package:mobile/domain/auth/repositories/auth_repository.dart';
import 'package:mobile/domain/auth/usecases/sign_in_usecase.dart';
import 'package:mocktail/mocktail.dart';

class _MockAuthRepository extends Mock implements AuthRepository {}

void main() {
  group('SignInUseCase', () {
    late _MockAuthRepository repository;
    late SignInUseCase useCase;

    setUp(() {
      repository = _MockAuthRepository();
      useCase = SignInUseCase(repository);
    });

    test('delegates to the repository and returns the session', () async {
      const session = AuthSessionEntity(
        accessToken: 'a',
        refreshToken: 'r',
        user: AuthUserEntity(id: '1', name: 'Ada', email: 'ada@store.dev'),
      );
      when(
        () => repository.signIn(
          email: any(named: 'email'),
          password: any(named: 'password'),
        ),
      ).thenAnswer((_) async => right(session));

      final result = await useCase(email: 'ada@store.dev', password: 'pw');

      expect(result, right<AuthFailure, AuthSessionEntity>(session));
      verify(
        () => repository.signIn(email: 'ada@store.dev', password: 'pw'),
      ).called(1);
    });
  });
}
