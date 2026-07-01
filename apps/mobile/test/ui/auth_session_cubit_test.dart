import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fpdart/fpdart.dart';
import 'package:mobile/core/network/http_client.dart';
import 'package:mobile/domain/auth/entities/auth_session_entity.dart';
import 'package:mobile/domain/auth/entities/auth_user_entity.dart';
import 'package:mobile/domain/auth/usecases/restore_session_usecase.dart';
import 'package:mobile/domain/auth/usecases/sign_out_usecase.dart';
import 'package:mobile/ui/auth/view_model/auth_session_cubit.dart';
import 'package:mobile/ui/auth/view_model/auth_session_state.dart';
import 'package:mocktail/mocktail.dart';

class _MockRestore extends Mock implements RestoreSessionUseCase {}

class _MockSignOut extends Mock implements SignOutUseCase {}

class _MockHttp extends Mock implements HttpClient {}

const _session = AuthSessionEntity(
  accessToken: 'a',
  refreshToken: 'r',
  user: AuthUserEntity(id: '1', name: 'Ada', email: 'ada@store.dev'),
);

void main() {
  late _MockRestore restore;
  late _MockSignOut signOut;
  late _MockHttp http;

  setUp(() {
    restore = _MockRestore();
    signOut = _MockSignOut();
    http = _MockHttp();
    when(() => http.setAuthToken(any())).thenReturn(null);
  });

  AuthSessionCubit build() => AuthSessionCubit(
    restoreSession: restore,
    signOut: signOut,
    httpClient: http,
  );

  blocTest<AuthSessionCubit, AuthSessionState>(
    'restore → authenticated + sets bearer when a session exists',
    setUp: () => when(restore.call).thenAnswer((_) async => some(_session)),
    build: build,
    act: (cubit) => cubit.restore(),
    expect: () => [
      isA<AuthSessionState>().having(
        (s) => s.status,
        'status',
        AuthStatus.authenticated,
      ),
    ],
    verify: (_) => verify(() => http.setAuthToken('a')).called(1),
  );

  blocTest<AuthSessionCubit, AuthSessionState>(
    'restore → unauthenticated when no session',
    setUp: () => when(restore.call).thenAnswer((_) async => none()),
    build: build,
    act: (cubit) => cubit.restore(),
    expect: () => [
      isA<AuthSessionState>().having(
        (s) => s.status,
        'status',
        AuthStatus.unauthenticated,
      ),
    ],
  );

  blocTest<AuthSessionCubit, AuthSessionState>(
    'logout → clears bearer and becomes unauthenticated',
    setUp: () => when(signOut.call).thenAnswer((_) async => right(unit)),
    build: build,
    act: (cubit) => cubit.logout(),
    expect: () => [
      isA<AuthSessionState>().having(
        (s) => s.status,
        'status',
        AuthStatus.unauthenticated,
      ),
    ],
    verify: (_) => verify(() => http.setAuthToken(null)).called(1),
  );
}
