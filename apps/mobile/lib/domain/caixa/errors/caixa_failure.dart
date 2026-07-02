import '../../errors/failure.dart';

/// Business failures for the cash-session (`caixa`) context. Codes mirror the
/// backend domain error codes so the UI can localize them consistently.
sealed class CaixaFailure extends Failure {
  const CaixaFailure(super.code, {super.message});
}

/// There is already an open session for the operator
/// (backend `CASH_SESSION_ALREADY_OPEN`).
class CashSessionAlreadyOpenFailure extends CaixaFailure {
  const CashSessionAlreadyOpenFailure({String? message})
    : super('caixa.already_open', message: message);
}

/// The referenced session does not exist (backend `CASH_SESSION_NOT_FOUND`).
class CashSessionNotFoundFailure extends CaixaFailure {
  const CashSessionNotFoundFailure({String? message})
    : super('caixa.not_found', message: message);
}

/// The session is already closed (backend `CASH_SESSION_ALREADY_CLOSED`).
class CashSessionAlreadyClosedFailure extends CaixaFailure {
  const CashSessionAlreadyClosedFailure({String? message})
    : super('caixa.already_closed', message: message);
}

/// The session still has a pending sale and cannot be closed
/// (backend `PENDING_SALE_IN_SESSION`).
class PendingSaleInSessionFailure extends CaixaFailure {
  const PendingSaleInSessionFailure({String? message})
    : super('caixa.pending_sale', message: message);
}

/// The session belongs to another operator (backend `ACESSO_NEGADO` → 403).
class CashSessionAccessDeniedFailure extends CaixaFailure {
  const CashSessionAccessDeniedFailure({String? message})
    : super('caixa.access_denied', message: message);
}

/// The submitted amount is invalid (e.g. negative opening, non-positive
/// sangria/suprimento). Validated client-side before hitting the backend.
class InvalidCashAmountFailure extends CaixaFailure {
  const InvalidCashAmountFailure({String? message})
    : super('caixa.invalid_amount', message: message);
}

/// A network/transport problem prevented the cash-session operation.
class CaixaNetworkFailure extends CaixaFailure {
  const CaixaNetworkFailure({String? message})
    : super('caixa.network', message: message);
}
