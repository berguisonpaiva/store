import 'package:fpdart/fpdart.dart';

import '../entities/venda_entity.dart';
import '../errors/vendas_failure.dart';
import '../repositories/vendas_repository.dart';

/// Adds an item to a sale. Validates client-side that the quantity is positive
/// and that exactly one identifier (variacaoId / sku / codigoBarras) is given.
class AdicionarItemUseCase {
  const AdicionarItemUseCase(this._repository);

  final VendasRepository _repository;

  Future<Either<VendasFailure, VendaEntity>> call({
    required String vendaId,
    required AdicionarItemParams params,
  }) {
    if (params.quantidade <= 0) {
      return Future.value(left(const InvalidSaleInputFailure()));
    }
    final identifiers = [
      params.variacaoId,
      params.sku,
      params.codigoBarras,
    ].where((id) => id != null && id.trim().isNotEmpty).length;
    if (identifiers != 1) {
      return Future.value(left(const InvalidSaleInputFailure()));
    }
    return _repository.adicionarItem(vendaId: vendaId, params: params);
  }
}
