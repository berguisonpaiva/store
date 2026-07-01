import 'package:flutter/material.dart';

import '../../../l10n/app_localizations.dart';
import '../../theme/app_spacing.dart';
import '../vendas_l10n.dart';

/// Subtotal / discount / total summary for the current sale. All values are in
/// cents and formatted to the locale currency here.
class VendaSummary extends StatelessWidget {
  const VendaSummary({
    super.key,
    required this.subtotalCents,
    required this.descontoCents,
    required this.totalCents,
  });

  final int subtotalCents;
  final int descontoCents;
  final int totalCents;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _SummaryRow(
          label: l10n.vendasSubtotal,
          value: l10n.formatVendaMoney(subtotalCents),
        ),
        if (descontoCents > 0)
          _SummaryRow(
            label: l10n.vendasDiscount,
            value: '- ${l10n.formatVendaMoney(descontoCents)}',
          ),
        const Divider(height: AppSpacing.lg),
        _SummaryRow(
          label: l10n.vendasTotal,
          value: l10n.formatVendaMoney(totalCents),
          style: theme.textTheme.titleLarge,
        ),
      ],
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({required this.label, required this.value, this.style});

  final String label;
  final String value;
  final TextStyle? style;

  @override
  Widget build(BuildContext context) {
    final effective = style ?? Theme.of(context).textTheme.bodyLarge;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: effective),
          Text(value, style: effective),
        ],
      ),
    );
  }
}
