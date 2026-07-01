import 'package:equatable/equatable.dart';

/// Authenticated user, as understood by the business domain.
class AuthUserEntity extends Equatable {
  const AuthUserEntity({
    required this.id,
    required this.name,
    required this.email,
    this.role,
  });

  final String id;
  final String name;
  final String email;

  /// Staff role (MASTER/ADMIN/OPERADOR), decoded from the access token.
  final String? role;

  @override
  List<Object?> get props => [id, name, email, role];
}
