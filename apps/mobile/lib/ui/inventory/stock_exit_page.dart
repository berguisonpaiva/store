import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../app/di/injector.dart';
import '../../domain/inventory/entities/stock_movement_reason.dart';
import '../../l10n/app_localizations.dart';
import '../shared/feedback/app_toast.dart';
import '../shared/widgets/primary_button.dart';
import '../theme/app_spacing.dart';
import 'inventory_l10n.dart';
import 'view_model/stock_movement_cubit.dart';
import 'view_model/stock_movement_state.dart';
import 'widgets/reason_dropdown.dart';

/// Register a manual stock exit (motivo PERDA/AJUSTE).
class StockExitPage extends StatefulWidget {
  const StockExitPage({super.key});

  @override
  State<StockExitPage> createState() => _StockExitPageState();
}

class _StockExitPageState extends State<StockExitPage> {
  late final StockMovementCubit _cubit = getIt<StockMovementCubit>();
  final _formKey = GlobalKey<FormState>();
  final _variationController = TextEditingController();
  final _quantityController = TextEditingController();
  StockMovementReason _reason = StockMovementReason.perda;

  @override
  void dispose() {
    _cubit.close();
    _variationController.dispose();
    _quantityController.dispose();
    super.dispose();
  }

  void _submit() {
    if (_formKey.currentState?.validate() ?? false) {
      _cubit.registerExit(
        variacaoId: _variationController.text,
        quantidade: int.parse(_quantityController.text.trim()),
        motivo: _reason,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.inventoryExitTitle)),
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
                    controller: _quantityController,
                    enabled: !state.isSubmitting,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: l10n.inventoryQuantityLabel,
                    ),
                    validator: (v) {
                      final n = int.tryParse(v?.trim() ?? '');
                      if (n == null) return l10n.inventoryQuantityRequired;
                      if (n <= 0) return l10n.inventoryQuantityInvalid;
                      return null;
                    },
                  ),
                  const SizedBox(height: AppSpacing.md),
                  ReasonDropdown(
                    reasons: StockMovementReason.exitReasons,
                    value: _reason,
                    enabled: !state.isSubmitting,
                    onChanged: (r) => setState(
                      () => _reason = r ?? StockMovementReason.perda,
                    ),
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
