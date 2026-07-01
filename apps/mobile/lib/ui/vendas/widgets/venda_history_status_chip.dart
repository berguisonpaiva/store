import 'package:flutter/material.dart';

import '../../../domain/vendas/entities/status_venda.dart';
import '../../../l10n/app_localizations.dart';
import '../../theme/app_spacing.dart';
import '../vendas_l10n.dart';

/// A colored badge for a sale status, reused by the history list and detail.
class VendaHistoryStatusChip extends StatelessWidget {
  const VendaHistoryStatusChip({super.key, required this.status});

  final StatusVenda status;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final theme = Theme.of(context);
    final color = switch (status) {
      StatusVenda.aberta => theme.colorScheme.tertiary,
      StatusVenda.concluida => theme.colorScheme.primary,
      StatusVenda.cancelada => theme.colorScheme.error,
    };
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xs,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(AppSpacing.xs),
      ),
      child: Text(
        l10n.vendasStatus(status),
        style: theme.textTheme.labelSmall?.copyWith(color: color),
      ),
    );
  }
}
