import 'package:fpdart/fpdart.dart';

import '../entities/auth_user_entity.dart';
import '../errors/auth_failure.dart';
import '../repositories/auth_repository.dart';

/// Fetches the authenticated user's profile.
class GetProfileUseCase {
  const GetProfileUseCase(this._repository);

  final AuthRepository _repository;

  Future<Either<AuthFailure, AuthUserEntity>> call() =>
      _repository.getProfile();
}
