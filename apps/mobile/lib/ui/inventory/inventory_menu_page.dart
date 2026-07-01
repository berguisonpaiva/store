import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../l10n/app_localizations.dart';
import '../theme/app_spacing.dart';

/// Hub for the inventory feature: lists the read and movement actions and
/// navigates to each sub-route.
class InventoryMenuPage extends StatelessWidget {
  const InventoryMenuPage({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    final items = <_MenuItem>[
      _MenuItem(Icons.search, l10n.inventoryBalanceTitle, '/inventory/balance'),
      _MenuItem(
        Icons.receipt_long,
        l10n.inventoryMovementsTitle,
        '/inventory/movements',
      ),
      _MenuItem(
        Icons.warning_amber,
        l10n.inventoryLowStockTitle,
        '/inventory/low-stock',
      ),
      _MenuItem(
        Icons.add_box,
        l10n.inventoryEntryTitle,
        '/inventory/entry',
      ),
      _MenuItem(
        Icons.remove_circle_outline,
        l10n.inventoryExitTitle,
        '/inventory/exit',
      ),
      _MenuItem(
        Icons.tune,
        l10n.inventoryAdjustmentTitle,
        '/inventory/adjustment',
      ),
    ];

    return Scaffold(
      appBar: AppBar(title: Text(l10n.inventoryTitle)),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          Text(
            l10n.inventoryMenuSubtitle,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: AppSpacing.md),
          for (final item in items)
            Card(
              child: ListTile(
                leading: Icon(item.icon),
                title: Text(item.label),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.push(item.route),
              ),
            ),
        ],
      ),
    );
  }
}

class _MenuItem {
  const _MenuItem(this.icon, this.label, this.route);

  final IconData icon;
  final String label;
  final String route;
}
