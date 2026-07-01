import 'package:fpdart/fpdart.dart';

import '../errors/auth_failure.dart';
import '../repositories/auth_repository.dart';

/// Signs the current user out.
class SignOutUseCase {
  const SignOutUseCase(this._repository);

  final AuthRepository _repository;

  Future<Either<AuthFailure, Unit>> call() => _repository.signOut();
}
