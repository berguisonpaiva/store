import 'package:flutter/material.dart';

import '../../../l10n/app_localizations.dart';
import '../../theme/app_spacing.dart';

/// Bip/search field for adding items by barcode or SKU. Owns only its local text
/// and mode; emits the typed code (and whether it is a SKU) through [onSubmit].
class VendaBipField extends StatefulWidget {
  const VendaBipField({
    super.key,
    required this.enabled,
    required this.onSubmit,
  });

  final bool enabled;
  final void Function(String code, {required bool isSku}) onSubmit;

  @override
  State<VendaBipField> createState() => _VendaBipFieldState();
}

class _VendaBipFieldState extends State<VendaBipField> {
  final _controller = TextEditingController();
  bool _isSku = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _submit() {
    final code = _controller.text.trim();
    if (code.isEmpty) return;
    widget.onSubmit(code, isSku: _isSku);
    _controller.clear();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SegmentedButton<bool>(
          segments: [
            ButtonSegment(
              value: false,
              label: Text(l10n.vendasBipModeBarcode),
              icon: const Icon(Icons.qr_code),
            ),
            ButtonSegment(
              value: true,
              label: Text(l10n.vendasBipModeSku),
              icon: const Icon(Icons.tag),
            ),
          ],
          selected: {_isSku},
          onSelectionChanged: widget.enabled
              ? (selection) => setState(() => _isSku = selection.first)
              : null,
        ),
        const SizedBox(height: AppSpacing.sm),
        TextField(
          controller: _controller,
          enabled: widget.enabled,
          autofocus: true,
          textInputAction: TextInputAction.done,
          decoration: InputDecoration(
            labelText: l10n.vendasBipLabel,
            suffixIcon: IconButton(
              icon: const Icon(Icons.add),
              tooltip: l10n.vendasAddAction,
              onPressed: widget.enabled ? _submit : null,
            ),
          ),
          onSubmitted: (_) => _submit(),
        ),
      ],
    );
  }
}
