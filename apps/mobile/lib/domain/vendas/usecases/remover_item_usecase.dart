import 'package:fpdart/fpdart.dart';

import '../entities/venda_entity.dart';
import '../errors/vendas_failure.dart';
import '../repositories/vendas_repository.dart';

/// Removes a line item from a sale.
class RemoverItemUseCase {
  const RemoverItemUseCase(this._repository);

  final VendasRepository _repository;

  Future<Either<VendasFailure, VendaEntity>> call({
    required String vendaId,
    required String itemId,
  }) => _repository.removerItem(vendaId: vendaId, itemId: itemId);
}
