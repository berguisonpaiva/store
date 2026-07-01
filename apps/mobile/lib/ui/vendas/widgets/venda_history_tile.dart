import 'package:flutter/material.dart';

import '../../../domain/vendas/entities/venda_entity.dart';
import '../../../l10n/app_localizations.dart';
import '../../theme/app_spacing.dart';
import '../vendas_l10n.dart';
import 'venda_history_status_chip.dart';

/// A single sale row in the operator's history list: number/id, status badge,
/// item count and total. Tapping opens the sale detail.
class VendaHistoryTile extends StatelessWidget {
  const VendaHistoryTile({super.key, required this.venda, this.onTap});

  final VendaEntity venda;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final theme = Theme.of(context);
    final title = venda.numero != null
        ? l10n.vendasHistoryNumber(venda.numero!)
        : venda.id;
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
      title: Text(title, maxLines: 1, overflow: TextOverflow.ellipsis),
      subtitle: Row(
        children: [
          VendaHistoryStatusChip(status: venda.status),
          const SizedBox(width: AppSpacing.sm),
          Text(
            l10n.vendasHistoryItemsCount(venda.itens.length),
            style: theme.textTheme.bodySmall,
          ),
        ],
      ),
      trailing: Text(
        l10n.formatVendaMoney(venda.totalCents),
        style: theme.textTheme.titleSmall,
      ),
      onTap: onTap,
    );
  }
}
