import 'package:flutter/material.dart';

import '../../../l10n/app_localizations.dart';
import '../../theme/app_spacing.dart';

/// Action row for an editable sale: discount, cancel and finalize.
class VendaPdvActions extends StatelessWidget {
  const VendaPdvActions({
    super.key,
    required this.enabled,
    required this.canFinalize,
    required this.onDiscount,
    required this.onCancel,
    required this.onFinalize,
  });

  final bool enabled;
  final bool canFinalize;
  final VoidCallback onDiscount;
  final VoidCallback onCancel;
  final VoidCallback onFinalize;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                icon: const Icon(Icons.percent),
                label: Text(l10n.vendasDiscountAction),
                onPressed: enabled ? onDiscount : null,
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: OutlinedButton.icon(
                icon: const Icon(Icons.close),
                label: Text(l10n.vendasCancelAction),
                onPressed: enabled ? onCancel : null,
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.sm),
        FilledButton.icon(
          icon: const Icon(Icons.payments_outlined),
          label: Text(l10n.vendasFinalizeAction),
          onPressed: enabled && canFinalize ? onFinalize : null,
        ),
      ],
    );
  }
}
