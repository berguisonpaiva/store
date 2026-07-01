import 'package:flutter/material.dart';

import '../../../domain/vendas/entities/item_venda_entity.dart';
import '../../../l10n/app_localizations.dart';
import '../../theme/app_spacing.dart';
import '../vendas_l10n.dart';

/// A single sale line item with its quantity, unit price and total. Shows a
/// remove action only while the sale is editable.
class VendaItemTile extends StatelessWidget {
  const VendaItemTile({
    super.key,
    required this.item,
    this.onRemove,
  });

  final ItemVendaEntity item;
  final VoidCallback? onRemove;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final theme = Theme.of(context);
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
      title: Text(item.variacaoId, maxLines: 1, overflow: TextOverflow.ellipsis),
      subtitle: Text(
        '${l10n.vendasItemQuantity(item.quantidade)} · '
        '${l10n.formatVendaMoney(item.precoUnitarioCents)}',
        style: theme.textTheme.bodySmall,
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            l10n.formatVendaMoney(item.totalCents),
            style: theme.textTheme.titleSmall,
          ),
          if (onRemove != null)
            IconButton(
              icon: const Icon(Icons.delete_outline),
              tooltip: l10n.vendasRemoveItem,
              onPressed: onRemove,
            ),
        ],
      ),
    );
  }
}
