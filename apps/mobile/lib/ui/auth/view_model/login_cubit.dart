import 'package:bloc/bloc.dart';

import '../../../domain/auth/usecases/sign_in_usecase.dart';
import 'auth_session_cubit.dart';
import 'login_state.dart';

/// Drives the login screen. Calls [SignInUseCase]; on success it hands the
/// session to [AuthSessionCubit] (which flips the app to authenticated and the
/// router redirects). No Flutter imports.
class LoginCubit extends Cubit<LoginState> {
  LoginCubit({
    required SignInUseCase signIn,
    required AuthSessionCubit authSession,
  }) : _signIn = signIn,
       _authSession = authSession,
       super(const LoginState());

  final SignInUseCase _signIn;
  final AuthSessionCubit _authSession;

  Future<void> submit({
    required String email,
    required String password,
  }) async {
    emit(const LoginState(status: LoginStatus.submitting));
    final result = await _signIn(email: email, password: password);
    result.match(
      (failure) =>
          emit(LoginState(status: LoginStatus.failure, errorCode: failure.code)),
      (session) {
        _authSession.onLoggedIn(session);
        emit(const LoginState(status: LoginStatus.success));
      },
    );
  }
}
