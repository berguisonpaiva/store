import 'package:fpdart/fpdart.dart';

import '../entities/auth_session_entity.dart';
import '../repositories/auth_repository.dart';

/// Restores the persisted session (if any) without hitting the network.
class RestoreSessionUseCase {
  const RestoreSessionUseCase(this._repository);

  final AuthRepository _repository;

  Future<Option<AuthSessionEntity>> call() => _repository.currentSession();
}
