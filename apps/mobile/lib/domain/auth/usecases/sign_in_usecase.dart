import 'package:fpdart/fpdart.dart';

import '../entities/auth_session_entity.dart';
import '../errors/auth_failure.dart';
import '../repositories/auth_repository.dart';

/// Signs a user in with email + password.
class SignInUseCase {
  const SignInUseCase(this._repository);

  final AuthRepository _repository;

  Future<Either<AuthFailure, AuthSessionEntity>> call({
    required String email,
    required String password,
  }) {
    return _repository.signIn(email: email, password: password);
  }
}
