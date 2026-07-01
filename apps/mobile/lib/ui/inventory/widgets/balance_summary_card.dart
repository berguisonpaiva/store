import 'package:flutter/material.dart';

import '../../../domain/inventory/entities/stock_balance_entity.dart';
import '../../../l10n/app_localizations.dart';
import '../../theme/app_spacing.dart';

/// Card summarizing a variation's current and minimum balance.
class BalanceSummaryCard extends StatelessWidget {
  const BalanceSummaryCard({super.key, required this.balance});

  final StockBalanceEntity balance;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    balance.variacaoId,
                    style: theme.textTheme.bodySmall,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (balance.isBelowMinimum)
                  _Badge(label: l10n.inventoryBelowMinimumBadge),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              '${balance.saldoAtual}',
              style: theme.textTheme.displaySmall,
            ),
            Text(
              l10n.inventoryCurrentBalance,
              style: theme.textTheme.bodyMedium,
            ),
            const Divider(height: AppSpacing.lg),
            _MetricRow(
              label: l10n.inventoryMinimum,
              value: '${balance.estoqueMinimo}',
            ),
          ],
        ),
      ),
    );
  }
}

class _MetricRow extends StatelessWidget {
  const _MetricRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: theme.textTheme.bodyMedium),
          Text(value, style: theme.textTheme.titleMedium),
        ],
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xs,
      ),
      decoration: BoxDecoration(
        color: scheme.errorContainer,
        borderRadius: BorderRadius.circular(AppSpacing.sm),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: scheme.onErrorContainer,
        ),
      ),
    );
  }
}
