import 'package:fpdart/fpdart.dart';

import '../entities/sessao_caixa_entity.dart';
import '../errors/caixa_failure.dart';
import '../repositories/caixa_repository.dart';

/// Lists the operator's own cash sessions (RN03), optionally filtered.
class ListarSessoesUseCase {
  const ListarSessoesUseCase(this._repository);

  final CaixaRepository _repository;

  Future<Either<CaixaFailure, List<SessaoCaixaEntity>>> call([
    SessoesCaixaFiltro filtro = const SessoesCaixaFiltro(),
  ]) => _repository.listarSessoes(filtro);
}
