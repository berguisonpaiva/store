import 'package:fpdart/fpdart.dart';

import '../entities/venda_entity.dart';
import '../errors/vendas_failure.dart';
import '../repositories/vendas_repository.dart';

/// Lists sales matching a filter.
class ListarVendasUseCase {
  const ListarVendasUseCase(this._repository);

  final VendasRepository _repository;

  Future<Either<VendasFailure, List<VendaEntity>>> call([
    VendasFiltro filtro = const VendasFiltro(),
  ]) => _repository.listar(filtro);
}
