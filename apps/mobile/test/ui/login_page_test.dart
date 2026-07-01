import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fpdart/fpdart.dart';
import 'package:mobile/app/di/injector.dart';
import 'package:mobile/domain/auth/entities/auth_session_entity.dart';
import 'package:mobile/domain/auth/entities/auth_user_entity.dart';
import 'package:mobile/domain/auth/usecases/sign_in_usecase.dart';
import 'package:mobile/l10n/app_localizations.dart';
import 'package:mobile/ui/auth/login_page.dart';
import 'package:mobile/ui/auth/view_model/auth_session_cubit.dart';
import 'package:mobile/ui/auth/view_model/login_cubit.dart';
import 'package:mocktail/mocktail.dart';

class _MockSignIn extends Mock implements SignInUseCase {}

class _MockAuthSession extends Mock implements AuthSessionCubit {}

const _session = AuthSessionEntity(
  accessToken: 'a',
  refreshToken: 'r',
  user: AuthUserEntity(id: '1', name: 'Ada', email: 'ada@store.dev'),
);

Widget _app() => const MaterialApp(
  locale: Locale('en'),
  localizationsDelegates: AppLocalizations.localizationsDelegates,
  supportedLocales: AppLocalizations.supportedLocales,
  home: LoginPage(),
);

void main() {
  late _MockSignIn signIn;
  late _MockAuthSession authSession;

  setUpAll(() => registerFallbackValue(_session));

  setUp(() {
    signIn = _MockSignIn();
    authSession = _MockAuthSession();
    when(() => authSession.onLoggedIn(any())).thenReturn(null);
    getIt.registerFactory(
      () => LoginCubit(signIn: signIn, authSession: authSession),
    );
  });

  tearDown(() => getIt.reset());

  testWidgets('renders two fields and does not submit when empty', (
    tester,
  ) async {
    await tester.pumpWidget(_app());

    expect(find.byType(TextFormField), findsNWidgets(2));

    await tester.tap(find.byType(FilledButton));
    await tester.pumpAndSettle();

    verifyNever(
      () => signIn(
        email: any(named: 'email'),
        password: any(named: 'password'),
      ),
    );
    expect(find.text('Enter your email.'), findsOneWidget);
  });

  testWidgets('submits valid credentials to the use case', (tester) async {
    when(
      () => signIn(
        email: any(named: 'email'),
        password: any(named: 'password'),
      ),
    ).thenAnswer((_) async => right(_session));

    await tester.pumpWidget(_app());

    await tester.enterText(
      find.byType(TextFormField).at(0),
      'ada@store.dev',
    );
    await tester.enterText(find.byType(TextFormField).at(1), 'secret');
    await tester.tap(find.byType(FilledButton));
    await tester.pumpAndSettle();

    verify(
      () => signIn(email: 'ada@store.dev', password: 'secret'),
    ).called(1);
  });
}
