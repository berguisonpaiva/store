import 'package:fpdart/fpdart.dart';

import '../entities/resumo_vendas_entity.dart';
import '../errors/vendas_failure.dart';
import '../repositories/vendas_repository.dart';

/// Returns aggregated totals over the sales matching a filter.
class ResumoVendasUseCase {
  const ResumoVendasUseCase(this._repository);

  final VendasRepository _repository;

  Future<Either<VendasFailure, ResumoVendasEntity>> call([
    VendasFiltro filtro = const VendasFiltro(),
  ]) => _repository.resumo(filtro);
}
