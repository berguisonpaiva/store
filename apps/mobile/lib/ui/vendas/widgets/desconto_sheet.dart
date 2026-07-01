import 'package:flutter/material.dart';

import '../../../domain/vendas/entities/tipo_desconto.dart';
import '../../../l10n/app_localizations.dart';
import '../../caixa/money_input.dart';
import '../../shared/widgets/primary_button.dart';
import '../../theme/app_spacing.dart';

/// Result of the discount sheet. [valor] is in cents when [tipo] is
/// [TipoDesconto.valor], or a percentage (0..100) when [TipoDesconto.percentual].
class DescontoInput {
  const DescontoInput({required this.tipo, required this.valor});

  final TipoDesconto tipo;
  final num valor;
}

/// Bottom sheet to capture a discount as an absolute amount or a percentage.
/// Validates that an absolute value does not exceed [subtotalCents] and that a
/// percentage stays in `0..100`. Returns a [DescontoInput] on confirm, or `null`
/// on cancel.
class DescontoSheet extends StatefulWidget {
  const DescontoSheet({super.key, required this.subtotalCents});

  final int subtotalCents;

  static Future<DescontoInput?> show(
    BuildContext context, {
    required int subtotalCents,
  }) {
    return showModalBottomSheet<DescontoInput>(
      context: context,
      isScrollControlled: true,
      builder: (_) => DescontoSheet(subtotalCents: subtotalCents),
    );
  }

  @override
  State<DescontoSheet> createState() => _DescontoSheetState();
}

class _DescontoSheetState extends State<DescontoSheet> {
  final _formKey = GlobalKey<FormState>();
  final _controller = TextEditingController();
  TipoDesconto _tipo = TipoDesconto.valor;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _submit() {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    final num valor = _tipo == TipoDesconto.valor
        ? parseReaisToCents(_controller.text)!
        : double.parse(_controller.text.trim().replaceAll(',', '.'));
    Navigator.of(context).pop(DescontoInput(tipo: _tipo, valor: valor));
  }

  String? _validate(AppLocalizations l10n, String? raw) {
    final text = raw?.trim() ?? '';
    if (text.isEmpty) return l10n.vendasDiscountValueRequired;
    if (_tipo == TipoDesconto.valor) {
      final cents = parseReaisToCents(text);
      if (cents == null || cents < 0) return l10n.vendasDiscountValueInvalid;
      if (cents > widget.subtotalCents) {
        return l10n.vendasDiscountExceedsSubtotal;
      }
    } else {
      final percent = double.tryParse(text.replaceAll(',', '.'));
      if (percent == null || percent < 0 || percent > 100) {
        return l10n.vendasDiscountValueInvalid;
      }
    }
    return null;
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
            Text(
              l10n.vendasDiscountTitle,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: AppSpacing.md),
            SegmentedButton<TipoDesconto>(
              segments: [
                ButtonSegment(
                  value: TipoDesconto.valor,
                  label: Text(l10n.vendasDiscountModeValue),
                ),
                ButtonSegment(
                  value: TipoDesconto.percentual,
                  label: Text(l10n.vendasDiscountModePercent),
                ),
              ],
              selected: {_tipo},
              onSelectionChanged: (selection) {
                setState(() => _tipo = selection.first);
                _formKey.currentState?.validate();
              },
            ),
            const SizedBox(height: AppSpacing.md),
            TextFormField(
              controller: _controller,
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
              ),
              decoration: InputDecoration(
                labelText: l10n.vendasDiscountValueLabel,
                suffixText: _tipo == TipoDesconto.percentual ? '%' : null,
              ),
              validator: (v) => _validate(l10n, v),
            ),
            const SizedBox(height: AppSpacing.lg),
            PrimaryButton(label: l10n.vendasAddAction, onPressed: _submit),
          ],
        ),
      ),
    );
  }
}
