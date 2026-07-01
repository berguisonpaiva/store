import 'package:flutter/material.dart';

import '../../../domain/inventory/entities/low_stock_item_entity.dart';
import '../../../l10n/app_localizations.dart';

/// List item rendering one low-stock alert.
class LowStockTile extends StatelessWidget {
  const LowStockTile({super.key, required this.item});

  final LowStockItemEntity item;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;

    return ListTile(
      leading: Icon(Icons.warning_amber, color: scheme.error),
      title: Text(item.variacaoId, overflow: TextOverflow.ellipsis),
      subtitle: Text(
        '${l10n.inventoryCurrentBalance}: ${item.saldoAtual} · '
        '${l10n.inventoryMinimum}: ${item.estoqueMinimo}',
      ),
      trailing: Text(
        '${item.saldoAtual}/${item.estoqueMinimo}',
        style: Theme.of(
          context,
        ).textTheme.titleMedium?.copyWith(color: scheme.error),
      ),
    );
  }
}
