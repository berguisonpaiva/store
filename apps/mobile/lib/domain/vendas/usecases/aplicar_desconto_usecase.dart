import 'package:fpdart/fpdart.dart';

import '../entities/tipo_desconto.dart';
import '../entities/venda_entity.dart';
import '../errors/vendas_failure.dart';
import '../repositories/vendas_repository.dart';

/// Applies a discount to a sale. Validates client-side that the value is
/// non-negative, that a percentage stays in `0..100`, and that an absolute
/// discount in cents does not exceed [subtotalCents] when it is known.
class AplicarDescontoUseCase {
  const AplicarDescontoUseCase(this._repository);

  final VendasRepository _repository;

  Future<Either<VendasFailure, VendaEntity>> call({
    required String vendaId,
    required TipoDesconto tipo,
    required num valor,
    int? subtotalCents,
  }) {
    if (valor < 0) {
      return Future.value(left(const InvalidSaleInputFailure()));
    }
    if (tipo == TipoDesconto.percentual && valor > 100) {
      return Future.value(left(const InvalidSaleInputFailure()));
    }
    if (tipo == TipoDesconto.valor &&
        subtotalCents != null &&
        valor > subtotalCents) {
      return Future.value(left(const InvalidSaleInputFailure()));
    }
    return _repository.aplicarDesconto(
      vendaId: vendaId,
      tipo: tipo,
      valor: valor,
    );
  }
}
