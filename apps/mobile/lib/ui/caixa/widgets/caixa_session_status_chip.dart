import 'package:flutter/material.dart';

import '../../../domain/caixa/entities/cash_session_status.dart';
import '../../../l10n/app_localizations.dart';
import '../../theme/app_spacing.dart';
import '../caixa_l10n.dart';

/// A colored badge for a cash-session status, reused by the history list and
/// detail.
class CaixaSessionStatusChip extends StatelessWidget {
  const CaixaSessionStatusChip({super.key, required this.status});

  final CashSessionStatus status;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final theme = Theme.of(context);
    final color = switch (status) {
      CashSessionStatus.aberto => theme.colorScheme.tertiary,
      CashSessionStatus.fechado => theme.colorScheme.primary,
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
        l10n.caixaSessionStatus(status),
        style: theme.textTheme.labelSmall?.copyWith(color: color),
      ),
    );
  }
}
