import '../../errors/failure.dart';

/// Business failures for the inventory context. Codes mirror the backend domain
/// error codes so the UI can localize them consistently.
sealed class InventoryFailure extends Failure {
  const InventoryFailure(super.code, {super.message});
}

/// The referenced variation does not exist (HTTP 404 / `VARIACAO_NAO_ENCONTRADA`).
class VariationNotFoundFailure extends InventoryFailure {
  const VariationNotFoundFailure({String? message})
    : super('inventory.variation_not_found', message: message);
}

/// The operation would leave the balance negative or below the available amount
/// (HTTP 409 / `ESTOQUE_INSUFICIENTE`).
class InsufficientStockFailure extends InventoryFailure {
  const InsufficientStockFailure({String? message})
    : super('inventory.insufficient_stock', message: message);
}

/// The quantity or target balance is invalid (HTTP 400 / `QUANTIDADE_INVALIDA`).
class InvalidQuantityFailure extends InventoryFailure {
  const InvalidQuantityFailure({String? message})
    : super('inventory.invalid_quantity', message: message);
}

/// A network/transport problem prevented the inventory operation.
class InventoryNetworkFailure extends InventoryFailure {
  const InventoryNetworkFailure({String? message})
    : super('inventory.network', message: message);
}
