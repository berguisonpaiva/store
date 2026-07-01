import 'package:intl/intl.dart';

import '../../l10n/app_localizations.dart';

/// Maps catalog domain codes to localized strings and formats integer-cent
/// prices to a currency string. Keeps screens free of switch statements and
/// formatting logic.
extension CatalogL10n on AppLocalizations {
  String catalogError(String? code) {
    return switch (code) {
      'catalog.product_not_found' => catalogErrorProductNotFound,
      'catalog.variation_not_found' => catalogErrorVariationNotFound,
      _ => catalogErrorNetwork,
    };
  }

  /// Formats integer cents to the locale's currency (e.g. 1990 → `$19.90`).
  String formatPrice(int cents) =>
      NumberFormat.simpleCurrency(locale: localeName).format(cents / 100);
}
