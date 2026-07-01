import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../app/di/injector.dart';
import '../../l10n/app_localizations.dart';
import '../shared/feedback/app_toast.dart';
import '../theme/app_spacing.dart';
import 'catalog_l10n.dart';
import 'view_model/variation_lookup_cubit.dart';
import 'view_model/variation_lookup_state.dart';
import 'widgets/variation_tile.dart';

enum _LookupMode { barcode, sku }

/// PDV lookup: resolve a variation by barcode (bipe) or SKU.
class VariationLookupPage extends StatefulWidget {
  const VariationLookupPage({super.key});

  @override
  State<VariationLookupPage> createState() => _VariationLookupPageState();
}

class _VariationLookupPageState extends State<VariationLookupPage> {
  late final VariationLookupCubit _cubit = getIt<VariationLookupCubit>();
  final _controller = TextEditingController();
  _LookupMode _mode = _LookupMode.barcode;

  @override
  void dispose() {
    _cubit.close();
    _controller.dispose();
    super.dispose();
  }

  void _lookup() {
    final code = _controller.text;
    if (_mode == _LookupMode.sku) {
      _cubit.lookupBySku(code);
    } else {
      _cubit.lookupByBarcode(code);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.catalogLookupTitle)),
      body: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: BlocConsumer<VariationLookupCubit, VariationLookupState>(
          bloc: _cubit,
          listener: (context, state) {
            if (state.status == VariationLookupStatus.notFound) {
              AppToast.error(context, l10n.catalogErrorVariationNotFound);
            } else if (state.status == VariationLookupStatus.error) {
              AppToast.error(context, l10n.catalogError(state.errorCode));
            }
          },
          builder: (context, state) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                SegmentedButton<_LookupMode>(
                  segments: [
                    ButtonSegment(
                      value: _LookupMode.barcode,
                      label: Text(l10n.catalogLookupModeBarcode),
                      icon: const Icon(Icons.qr_code),
                    ),
                    ButtonSegment(
                      value: _LookupMode.sku,
                      label: Text(l10n.catalogLookupModeSku),
                      icon: const Icon(Icons.tag),
                    ),
                  ],
                  selected: {_mode},
                  onSelectionChanged: (selection) =>
                      setState(() => _mode = selection.first),
                ),
                const SizedBox(height: AppSpacing.md),
                TextField(
                  controller: _controller,
                  decoration: InputDecoration(
                    labelText: l10n.catalogLookupCodeLabel,
                  ),
                  enabled: !state.isLoading,
                  textInputAction: TextInputAction.search,
                  onSubmitted: (_) => _lookup(),
                ),
                const SizedBox(height: AppSpacing.md),
                FilledButton(
                  onPressed: state.isLoading ? null : _lookup,
                  child: state.isLoading
                      ? const SizedBox(
                          height: 18,
                          width: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Text(l10n.catalogLookupAction),
                ),
                const SizedBox(height: AppSpacing.lg),
                if (state.status == VariationLookupStatus.loaded &&
                    state.result != null) ...[
                  Text(
                    state.result!.productName,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  VariationTile(variation: state.result!.variation),
                ] else if (state.status == VariationLookupStatus.idle)
                  Text(
                    l10n.catalogLookupHint,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
              ],
            );
          },
        ),
      ),
    );
  }
}
