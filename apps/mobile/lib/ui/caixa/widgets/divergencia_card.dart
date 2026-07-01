import 'package:flutter/material.dart';

import '../../../l10n/app_localizations.dart';
import '../../theme/app_spacing.dart';
import '../caixa_l10n.dart';

/// Shows expected, counted and the resulting divergence (surplus/shortage).
/// Divergence is paired with an icon and label so colour is not the only cue.
class DivergenciaCard extends StatelessWidget {
  const DivergenciaCard({
    super.key,
    required this.esperadoCents,
    required this.contadoCents,
    required this.divergenciaCents,
  });

  final int esperadoCents;
  final int? contadoCents;
  final int? divergenciaCents;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    final divergence = divergenciaCents;
    final (icon, color, label) = switch (divergence) {
      null => (Icons.remove, scheme.onSurfaceVariant, l10n.caixaDivergenceNone),
      0 => (Icons.check_circle_outline, scheme.primary, l10n.caixaDivergenceNone),
      final d when d > 0 => (
        Icons.arrow_upward,
        scheme.tertiary,
        l10n.caixaDivergenceSurplus,
      ),
      _ => (Icons.arrow_downward, scheme.error, l10n.caixaDivergenceShortage),
    };

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _Row(
              label: l10n.caixaSummaryExpected,
              value: l10n.formatMoney(esperadoCents),
            ),
            _Row(
              label: l10n.caixaSummaryCounted,
              value: contadoCents == null ? '—' : l10n.formatMoney(contadoCents!),
            ),
            const Divider(),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(icon, color: color, size: 20),
                    const SizedBox(width: AppSpacing.xs),
                    Text(label, style: textTheme.titleMedium),
                  ],
                ),
                Text(
                  divergence == null ? '—' : l10n.formatMoney(divergence),
                  style: textTheme.titleMedium?.copyWith(color: color),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: textTheme.bodyMedium),
          Text(value, style: textTheme.bodyMedium),
        ],
      ),
    );
  }
}
