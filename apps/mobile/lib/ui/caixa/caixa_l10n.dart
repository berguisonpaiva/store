import 'package:intl/intl.dart';

import '../../domain/caixa/entities/cash_movement_type.dart';
import '../../l10n/app_localizations.dart';

/// Maps cash-session domain codes/enums to localized, user-facing strings and
/// formats money. Keeps screens free of switch statements.
extension CaixaL10n on AppLocalizations {
  String caixaError(String? code) {
    return switch (code) {
      'caixa.already_open' => caixaErrorAlreadyOpen,
      'caixa.not_found' => caixaErrorNotFound,
      'caixa.already_closed' => caixaErrorAlreadyClosed,
      'caixa.pending_sale' => caixaErrorPendingSale,
      'caixa.invalid_amount' => caixaErrorInvalidAmount,
      _ => caixaErrorNetwork,
    };
  }

  String caixaMovementType(CashMovementType type) => switch (type) {
    CashMovementType.abertura => caixaTypeAbertura,
    CashMovementType.suprimento => caixaTypeSuprimento,
    CashMovementType.sangria => caixaTypeSangria,
    CashMovementType.vendaDinheiro => caixaTypeVendaDinheiro,
    CashMovementType.fechamento => caixaTypeFechamento,
  };

  /// Formats integer cents to the locale's currency (e.g. 1990 → `R$ 19,90`).
  String formatMoney(int cents) =>
      NumberFormat.simpleCurrency(locale: localeName).format(cents / 100);
}
