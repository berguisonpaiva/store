import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../domain/inventory/entities/stock_movement_entity.dart';
import '../../../domain/inventory/entities/stock_movement_type.dart';
import '../../../l10n/app_localizations.dart';
import '../inventory_l10n.dart';

/// List item rendering one ledger movement.
class MovementTile extends StatelessWidget {
  const MovementTile({super.key, required this.movement});

  final StockMovementEntity movement;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final scheme = Theme.of(context).colorScheme;
    final isEntry = movement.tipo == StockMovementType.entrada;
    final sign = isEntry ? '+' : '-';
    final color = isEntry ? scheme.primary : scheme.error;

    return ListTile(
      leading: Icon(
        isEntry ? Icons.south_west : Icons.north_east,
        color: color,
      ),
      title: Text(
        '${l10n.movementType(movement.tipo)} · ${l10n.movementReason(movement.motivo)}',
      ),
      subtitle: Text(
        DateFormat.yMd().add_Hm().format(movement.criadoEm),
      ),
      trailing: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Text(
            '$sign${movement.quantidade}',
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(color: color),
          ),
          Text(
            '${movement.saldoResultante}',
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}
