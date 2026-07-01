import 'package:fpdart/fpdart.dart';

import '../entities/venda_entity.dart';
import '../errors/vendas_failure.dart';
import '../repositories/vendas_repository.dart';

/// Opens a new sale for the operator's open cash session. Identity (operator and
/// session) is derived server-side; the client sends an empty body.
class CriarVendaUseCase {
  const CriarVendaUseCase(this._repository);

  final VendasRepository _repository;

  Future<Either<VendasFailure, VendaEntity>> call() => _repository.criar();
}
