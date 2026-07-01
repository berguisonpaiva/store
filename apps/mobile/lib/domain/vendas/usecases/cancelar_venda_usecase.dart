import 'package:fpdart/fpdart.dart';

import '../entities/venda_entity.dart';
import '../errors/vendas_failure.dart';
import '../repositories/vendas_repository.dart';

/// Cancels an open sale, reversing its effects on the backend.
class CancelarVendaUseCase {
  const CancelarVendaUseCase(this._repository);

  final VendasRepository _repository;

  Future<Either<VendasFailure, VendaEntity>> call(String vendaId) =>
      _repository.cancelar(vendaId);
}
