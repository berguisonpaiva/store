import 'package:fpdart/fpdart.dart';

import '../entities/auth_session_entity.dart';
import '../errors/auth_failure.dart';
import '../repositories/auth_repository.dart';

/// Refreshes the access token using the stored refresh token.
class RefreshSessionUseCase {
  const RefreshSessionUseCase(this._repository);

  final AuthRepository _repository;

  Future<Either<AuthFailure, AuthSessionEntity>> call() =>
      _repository.refresh();
}
