import 'package:fpdart/fpdart.dart';

import '../entities/venda_entity.dart';
import '../errors/vendas_failure.dart';
import '../repositories/vendas_repository.dart';

/// Finalizes a sale with its payments. Validates client-side that at least one
/// payment is present and that every leg is positive; the backend remains the
/// authority on `payments == total` (`PAYMENT_MISMATCH`).
class FinalizarVendaUseCase {
  const FinalizarVendaUseCase(this._repository);

  final VendasRepository _repository;

  Future<Either<VendasFailure, VendaEntity>> call({
    required String vendaId,
    required List<PagamentoInput> pagamentos,
  }) {
    if (pagamentos.isEmpty || pagamentos.any((p) => p.valorCents <= 0)) {
      return Future.value(left(const InvalidSaleInputFailure()));
    }
    return _repository.finalizar(vendaId: vendaId, pagamentos: pagamentos);
  }
}
