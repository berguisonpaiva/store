import 'package:bloc/bloc.dart';

import '../../../core/network/http_client.dart';
import '../../../domain/auth/entities/auth_session_entity.dart';
import '../../../domain/auth/usecases/restore_session_usecase.dart';
import '../../../domain/auth/usecases/sign_out_usecase.dart';
import 'auth_session_state.dart';

/// Owns the app-level [AuthStatus]. Drives the router guard via its stream and
/// keeps the HTTP bearer token in sync with the session.
class AuthSessionCubit extends Cubit<AuthSessionState> {
  AuthSessionCubit({
    required RestoreSessionUseCase restoreSession,
    required SignOutUseCase signOut,
    required HttpClient httpClient,
  }) : _restoreSession = restoreSession,
       _signOut = signOut,
       _httpClient = httpClient,
       super(const AuthSessionState.unknown());

  final RestoreSessionUseCase _restoreSession;
  final SignOutUseCase _signOut;
  final HttpClient _httpClient;

  /// Restores a persisted session on startup (no network).
  Future<void> restore() async {
    final session = await _restoreSession();
    session.match(
      () => emit(const AuthSessionState.unauthenticated()),
      (s) {
        _httpClient.setAuthToken(s.accessToken);
        emit(AuthSessionState.authenticated(s.user));
      },
    );
  }

  /// Called after a successful login.
  void onLoggedIn(AuthSessionEntity session) {
    _httpClient.setAuthToken(session.accessToken);
    emit(AuthSessionState.authenticated(session.user));
  }

  /// Clears the session and bearer (logout or refresh failure).
  Future<void> logout() async {
    await _signOut();
    _httpClient.setAuthToken(null);
    emit(const AuthSessionState.unauthenticated());
  }

  /// Called by the HTTP interceptor when refresh fails.
  void onAuthFailure() {
    _httpClient.setAuthToken(null);
    emit(const AuthSessionState.unauthenticated());
  }
}
