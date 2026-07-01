import 'package:flutter/material.dart';

import '../../../l10n/app_localizations.dart';
import '../../shared/widgets/primary_button.dart';
import '../../theme/app_spacing.dart';
import '../money_input.dart';

/// Result of the sangria/suprimento sheet.
class CashMovementInput {
  const CashMovementInput({required this.valorCents, required this.observacao});

  final int valorCents;
  final String observacao;
}

/// Bottom sheet to capture a sangria/suprimento (`valor > 0` + required
/// `observacao`). Returns a [CashMovementInput] on confirm, or `null` on cancel.
class CashMovementSheet extends StatefulWidget {
  const CashMovementSheet({super.key, required this.title});

  final String title;

  static Future<CashMovementInput?> show(
    BuildContext context, {
    required String title,
  }) {
    return showModalBottomSheet<CashMovementInput>(
      context: context,
      isScrollControlled: true,
      builder: (_) => CashMovementSheet(title: title),
    );
  }

  @override
  State<CashMovementSheet> createState() => _CashMovementSheetState();
}

class _CashMovementSheetState extends State<CashMovementSheet> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _observationController = TextEditingController();

  @override
  void dispose() {
    _amountController.dispose();
    _observationController.dispose();
    super.dispose();
  }

  void _submit() {
    if (_formKey.currentState?.validate() ?? false) {
      Navigator.of(context).pop(
        CashMovementInput(
          valorCents: parseReaisToCents(_amountController.text)!,
          observacao: _observationController.text.trim(),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Padding(
      padding: EdgeInsets.only(
        left: AppSpacing.md,
        right: AppSpacing.md,
        top: AppSpacing.md,
        bottom: MediaQuery.of(context).viewInsets.bottom + AppSpacing.md,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(widget.title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: AppSpacing.md),
            TextFormField(
              controller: _amountController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: InputDecoration(labelText: l10n.caixaAmountLabel),
              validator: (v) {
                if (v?.trim().isEmpty ?? true) return l10n.caixaAmountRequired;
                final cents = parseReaisToCents(v!);
                if (cents == null || cents <= 0) return l10n.caixaAmountInvalid;
                return null;
              },
            ),
            const SizedBox(height: AppSpacing.md),
            TextFormField(
              controller: _observationController,
              decoration: InputDecoration(labelText: l10n.caixaObservationLabel),
              validator: (v) => (v?.trim().isEmpty ?? true)
                  ? l10n.caixaObservationRequired
                  : null,
            ),
            const SizedBox(height: AppSpacing.lg),
            PrimaryButton(label: l10n.caixaSubmitAction, onPressed: _submit),
          ],
        ),
      ),
    );
  }
}
