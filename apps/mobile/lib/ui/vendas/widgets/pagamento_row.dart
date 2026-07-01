import 'package:flutter/material.dart';

import '../../../domain/vendas/entities/forma_pagamento.dart';
import '../../../l10n/app_localizations.dart';
import '../../theme/app_spacing.dart';
import '../vendas_l10n.dart';

/// One editable payment leg: a method dropdown, an amount field and a remove
/// button. Stateless — the parent owns the value and the controller.
class PagamentoRow extends StatelessWidget {
  const PagamentoRow({
    super.key,
    required this.forma,
    required this.controller,
    required this.onFormaChanged,
    required this.onChanged,
    required this.onRemove,
  });

  final FormaPagamento forma;
  final TextEditingController controller;
  final ValueChanged<FormaPagamento> onFormaChanged;
  final VoidCallback onChanged;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
      child: Row(
        children: [
          Expanded(
            flex: 3,
            child: DropdownButtonFormField<FormaPagamento>(
              initialValue: forma,
              decoration: InputDecoration(labelText: l10n.vendasPaymentFormLabel),
              items: [
                for (final f in FormaPagamento.values)
                  DropdownMenuItem(
                    value: f,
                    child: Text(l10n.vendasFormaPagamento(f)),
                  ),
              ],
              onChanged: (f) {
                if (f != null) onFormaChanged(f);
              },
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            flex: 2,
            child: TextField(
              controller: controller,
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
              ),
              decoration: InputDecoration(
                labelText: l10n.vendasPaymentAmountLabel,
              ),
              onChanged: (_) => onChanged(),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.remove_circle_outline),
            tooltip: l10n.vendasPaymentRemove,
            onPressed: onRemove,
          ),
        ],
      ),
    );
  }
}
