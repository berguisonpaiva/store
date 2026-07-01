import 'package:flutter/widgets.dart';

import '../core/network/http_client.dart';
import '../domain/auth/usecases/refresh_session_usecase.dart';
import '../ui/auth/view_model/auth_session_cubit.dart';
import 'app_widget.dart';
import 'config/app_config.dart';
import 'di/injector.dart';
import 'router/app_router.dart';

/// Initializes bindings + DI, wires auth token refresh, restores the persisted
/// session, then returns the root widget with the guarded router.
Future<Widget> bootstrap() async {
  WidgetsFlutterBinding.ensureInitialized();
  final config = AppConfig.fromEnvironment();
  await configureDependencies(config);

  final httpClient = getIt<HttpClient>();
  final session = getIt<AuthSessionCubit>();

  // On 401, refresh the access token (and keep the bearer in sync); on failure,
  // drop the session so the guard routes to /login.
  httpClient.configureAuth(
    onRefresh: () async {
      final result = await getIt<RefreshSessionUseCase>()();
      return result.match(
        (_) => null,
        (s) {
          httpClient.setAuthToken(s.accessToken);
          return s.accessToken;
        },
      );
    },
    onAuthFailure: () async => session.onAuthFailure(),
  );

  await session.restore();

  return AppWidget(router: createAppRouter(session));
}
