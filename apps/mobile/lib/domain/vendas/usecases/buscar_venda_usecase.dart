import 'package:fpdart/fpdart.dart';

import '../entities/venda_entity.dart';
import '../errors/vendas_failure.dart';
import '../repositories/vendas_repository.dart';

/// Fetches a single sale by id.
class BuscarVendaUseCase {
  const BuscarVendaUseCase(this._repository);

  final VendasRepository _repository;

  Future<Either<VendasFailure, VendaEntity>> call(String vendaId) =>
      _repository.buscar(vendaId);
}
