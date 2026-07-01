import 'package:equatable/equatable.dart';

import '../../../domain/auth/entities/auth_user_entity.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

/// App-level authentication state, consumed by the router guard.
class AuthSessionState extends Equatable {
  const AuthSessionState({required this.status, this.user});

  const AuthSessionState.unknown()
    : status = AuthStatus.unknown,
      user = null;

  const AuthSessionState.unauthenticated()
    : status = AuthStatus.unauthenticated,
      user = null;

  const AuthSessionState.authenticated(AuthUserEntity this.user)
    : status = AuthStatus.authenticated;

  final AuthStatus status;
  final AuthUserEntity? user;

  bool get isAuthenticated => status == AuthStatus.authenticated;
  bool get isUnknown => status == AuthStatus.unknown;

  @override
  List<Object?> get props => [status, user];
}
