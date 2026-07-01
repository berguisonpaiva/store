import 'package:flutter/material.dart';

import '../../../l10n/app_localizations.dart';
import '../../theme/app_spacing.dart';

/// Action buttons for the active session: sangria, suprimento and fechar.
class SessaoAtivaActions extends StatelessWidget {
  const SessaoAtivaActions({
    super.key,
    required this.enabled,
    required this.onSangria,
    required this.onSuprimento,
    required this.onFechar,
  });

  final bool enabled;
  final VoidCallback onSangria;
  final VoidCallback onSuprimento;
  final VoidCallback? onFechar;

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
                onPressed: enabled ? onSangria : null,
                icon: const Icon(Icons.remove_circle_outline),
                label: Text(l10n.caixaWithdrawalAction),
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: enabled ? onSuprimento : null,
                icon: const Icon(Icons.add_circle_outline),
                label: Text(l10n.caixaSupplyAction),
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.sm),
        FilledButton.icon(
          onPressed: (enabled && onFechar != null) ? onFechar : null,
          icon: const Icon(Icons.lock_outline),
          label: Text(l10n.caixaCloseAction),
        ),
      ],
    );
  }
}
