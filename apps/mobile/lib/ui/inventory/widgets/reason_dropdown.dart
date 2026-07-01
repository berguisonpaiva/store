import 'package:flutter/material.dart';

import '../../../domain/inventory/entities/stock_movement_reason.dart';
import '../../../l10n/app_localizations.dart';
import '../inventory_l10n.dart';

/// Dropdown for selecting a stock movement reason from an allowed set.
class ReasonDropdown extends StatelessWidget {
  const ReasonDropdown({
    super.key,
    required this.reasons,
    required this.value,
    required this.onChanged,
    this.enabled = true,
  });

  final List<StockMovementReason> reasons;
  final StockMovementReason value;
  final ValueChanged<StockMovementReason?> onChanged;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return DropdownButtonFormField<StockMovementReason>(
      initialValue: value,
      decoration: InputDecoration(labelText: l10n.inventoryReasonLabel),
      items: [
        for (final reason in reasons)
          DropdownMenuItem(
            value: reason,
            child: Text(l10n.movementReason(reason)),
          ),
      ],
      onChanged: enabled ? onChanged : null,
    );
  }
}
