import 'package:equatable/equatable.dart';

import 'auth_user_entity.dart';

/// A successful authentication: the tokens plus the authenticated user.
class AuthSessionEntity extends Equatable {
  const AuthSessionEntity({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  final String accessToken;
  final String refreshToken;
  final AuthUserEntity user;

  @override
  List<Object?> get props => [accessToken, refreshToken, user];
}
