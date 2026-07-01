import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../app/di/injector.dart';
import '../../l10n/app_localizations.dart';
import '../shared/feedback/app_toast.dart';
import '../shared/widgets/primary_button.dart';
import '../theme/app_spacing.dart';
import 'inventory_l10n.dart';
import 'view_model/stock_movement_cubit.dart';
import 'view_model/stock_movement_state.dart';

/// Adjust the balance of a variation to an absolute counted value. The
/// justification is required and stored as the movement note.
class StockAdjustmentPage extends StatefulWidget {
  const StockAdjustmentPage({super.key});

  @override
  State<StockAdjustmentPage> createState() => _StockAdjustmentPageState();
}

class _StockAdjustmentPageState extends State<StockAdjustmentPage> {
  late final StockMovementCubit _cubit = getIt<StockMovementCubit>();
  final _formKey = GlobalKey<FormState>();
  final _variationController = TextEditingController();
  final _balanceController = TextEditingController();
  final _justificationController = TextEditingController();

  @override
  void dispose() {
    _cubit.close();
    _variationController.dispose();
    _balanceController.dispose();
    _justificationController.dispose();
    super.dispose();
  }

  void _submit() {
    if (_formKey.currentState?.validate() ?? false) {
      _cubit.adjustBalance(
        variacaoId: _variationController.text,
        novoSaldo: int.parse(_balanceController.text.trim()),
        observacao: _justificationController.text,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.inventoryAdjustmentTitle)),
      body: BlocConsumer<StockMovementCubit, StockMovementState>(
        bloc: _cubit,
        listener: (context, state) {
          if (state.status == StockMovementStatus.success) {
            AppToast.show(context, l10n.inventorySaved);
            Navigator.of(context).pop(true);
          } else if (state.status == StockMovementStatus.failure) {
            AppToast.error(context, l10n.inventoryError(state.errorCode));
          }
        },
        builder: (context, state) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextFormField(
                    controller: _variationController,
                    enabled: !state.isSubmitting,
                    decoration: InputDecoration(
                      labelText: l10n.inventoryVariationIdLabel,
                    ),
                    validator: (v) => (v?.trim().isEmpty ?? true)
                        ? l10n.inventoryVariationIdRequired
                        : null,
                  ),
                  const SizedBox(height: AppSpacing.md),
                  TextFormField(
                    controller: _balanceController,
                    enabled: !state.isSubmitting,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: l10n.inventoryNewBalanceLabel,
                    ),
                    validator: (v) {
                      final n = int.tryParse(v?.trim() ?? '');
                      if (n == null) return l10n.inventoryNewBalanceRequired;
                      if (n < 0) return l10n.inventoryNewBalanceInvalid;
                      return null;
                    },
                  ),
                  const SizedBox(height: AppSpacing.md),
                  TextFormField(
                    controller: _justificationController,
                    enabled: !state.isSubmitting,
                    maxLines: 2,
                    decoration: InputDecoration(
                      labelText: l10n.inventoryJustificationLabel,
                    ),
                    validator: (v) => (v?.trim().isEmpty ?? true)
                        ? l10n.inventoryJustificationRequired
                        : null,
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  PrimaryButton(
                    label: l10n.inventorySubmitAction,
                    isLoading: state.isSubmitting,
                    onPressed: _submit,
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
