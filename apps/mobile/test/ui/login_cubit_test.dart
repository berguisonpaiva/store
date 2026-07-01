import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fpdart/fpdart.dart';
import 'package:mobile/domain/auth/entities/auth_session_entity.dart';
import 'package:mobile/domain/auth/entities/auth_user_entity.dart';
import 'package:mobile/domain/auth/errors/auth_failure.dart';
import 'package:mobile/domain/auth/usecases/sign_in_usecase.dart';
import 'package:mobile/ui/auth/view_model/auth_session_cubit.dart';
import 'package:mobile/ui/auth/view_model/login_cubit.dart';
import 'package:mobile/ui/auth/view_model/login_state.dart';
import 'package:mocktail/mocktail.dart';

class _MockSignIn extends Mock implements SignInUseCase {}

class _MockAuthSession extends Mock implements AuthSessionCubit {}

const _session = AuthSessionEntity(
  accessToken: 'a',
  refreshToken: 'r',
  user: AuthUserEntity(id: '1', name: 'Ada', email: 'ada@store.dev'),
);

void main() {
  late _MockSignIn signIn;
  late _MockAuthSession authSession;

  setUpAll(() => registerFallbackValue(_session));

  setUp(() {
    signIn = _MockSignIn();
    authSession = _MockAuthSession();
    when(() => authSession.onLoggedIn(any())).thenReturn(null);
  });

  LoginCubit build() => LoginCubit(signIn: signIn, authSession: authSession);

  blocTest<LoginCubit, LoginState>(
    'success → submitting then success, hands session to AuthSessionCubit',
    setUp: () => when(
      () => signIn(
        email: any(named: 'email'),
        password: any(named: 'password'),
      ),
    ).thenAnswer((_) async => right(_session)),
    build: build,
    act: (cubit) => cubit.submit(email: 'ada@store.dev', password: 'pw'),
    expect: () => const [
      LoginState(status: LoginStatus.submitting),
      LoginState(status: LoginStatus.success),
    ],
    verify: (_) => verify(() => authSession.onLoggedIn(_session)).called(1),
  );

  blocTest<LoginCubit, LoginState>(
    'invalid credentials → submitting then failure with the error code',
    setUp: () => when(
      () => signIn(
        email: any(named: 'email'),
        password: any(named: 'password'),
      ),
    ).thenAnswer((_) async => left(const InvalidCredentialsFailure())),
    build: build,
    act: (cubit) => cubit.submit(email: 'x', password: 'y'),
    expect: () => [
      const LoginState(status: LoginStatus.submitting),
      isA<LoginState>()
          .having((s) => s.status, 'status', LoginStatus.failure)
          .having((s) => s.errorCode, 'errorCode', 'auth.invalid_credentials'),
    ],
    verify: (_) => verifyNever(() => authSession.onLoggedIn(any())),
  );
}
