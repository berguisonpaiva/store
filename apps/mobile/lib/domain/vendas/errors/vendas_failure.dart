import '../../errors/failure.dart';

/// Business failures for the sales (`vendas`) context. Codes mirror the backend
/// domain error codes so the UI can localize them consistently.
sealed class VendasFailure extends Failure {
  const VendasFailure(super.code, {super.message});
}

/// The referenced sale does not exist (backend `SALE_NOT_FOUND`, HTTP 404).
class SaleNotFoundFailure extends VendasFailure {
  const SaleNotFoundFailure({String? message})
    : super('vendas.not_found', message: message);
}

/// The sale is already finalized and cannot be mutated
/// (backend `SALE_ALREADY_FINALIZED`, HTTP 409).
class SaleAlreadyFinalizedFailure extends VendasFailure {
  const SaleAlreadyFinalizedFailure({String? message})
    : super('vendas.already_finalized', message: message);
}

/// The operator has no open cash session, so a sale cannot start
/// (backend `NO_OPEN_CASH_SESSION`, HTTP 422).
class NoOpenCashSessionFailure extends VendasFailure {
  const NoOpenCashSessionFailure({String? message})
    : super('vendas.no_open_cash_session', message: message);
}

/// Stock is insufficient for one of the items on finalize
/// (backend `INSUFFICIENT_STOCK`, HTTP 422).
class InsufficientStockFailure extends VendasFailure {
  const InsufficientStockFailure({String? message})
    : super('vendas.insufficient_stock', message: message);
}

/// The payments do not sum to the sale total on finalize
/// (backend `PAYMENT_MISMATCH`, HTTP 422).
class PaymentMismatchFailure extends VendasFailure {
  const PaymentMismatchFailure({String? message})
    : super('vendas.payment_mismatch', message: message);
}

/// The submitted value is invalid (e.g. non-positive quantity, discount above
/// the subtotal). Validated client-side before hitting the backend.
class InvalidSaleInputFailure extends VendasFailure {
  const InvalidSaleInputFailure({String? message})
    : super('vendas.invalid_input', message: message);
}

/// A network/transport problem prevented the sales operation.
class VendasNetworkFailure extends VendasFailure {
  const VendasNetworkFailure({String? message})
    : super('vendas.network', message: message);
}
