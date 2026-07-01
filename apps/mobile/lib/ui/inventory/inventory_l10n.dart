import '../../domain/inventory/entities/stock_movement_reason.dart';
import '../../domain/inventory/entities/stock_movement_type.dart';
import '../../l10n/app_localizations.dart';

/// Maps inventory domain codes/enums to localized, user-facing strings. Keeps
/// the mapping in one place so screens stay free of switch statements.
extension InventoryL10n on AppLocalizations {
  String inventoryError(String? code) {
    return switch (code) {
      'inventory.variation_not_found' => inventoryErrorVariationNotFound,
      'inventory.insufficient_stock' => inventoryErrorInsufficientStock,
      'inventory.invalid_quantity' => inventoryErrorInvalidQuantity,
      _ => inventoryErrorNetwork,
    };
  }

  String movementType(StockMovementType type) => switch (type) {
    StockMovementType.entrada => inventoryTypeEntrada,
    StockMovementType.saida => inventoryTypeSaida,
  };

  String movementReason(StockMovementReason reason) => switch (reason) {
    StockMovementReason.compra => inventoryReasonCompra,
    StockMovementReason.devolucao => inventoryReasonDevolucao,
    StockMovementReason.ajuste => inventoryReasonAjuste,
    StockMovementReason.perda => inventoryReasonPerda,
    StockMovementReason.vendaPdv => inventoryReasonVenda,
    StockMovementReason.vendaOnline => inventoryReasonVenda,
  };
}
