import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../app/di/injector.dart';
import '../../l10n/app_localizations.dart';
import '../shared/feedback/app_toast.dart';
import '../shared/widgets/primary_button.dart';
import '../theme/app_spacing.dart';
import 'caixa_l10n.dart';
import 'money_input.dart';
import 'view_model/abrir_caixa_cubit.dart';
import 'view_model/abrir_caixa_state.dart';

/// Opens a cash session with a starting float (`valorAbertura >= 0`).
class AbrirCaixaPage extends StatefulWidget {
  const AbrirCaixaPage({super.key});

  @override
  State<AbrirCaixaPage> createState() => _AbrirCaixaPageState();
}

class _AbrirCaixaPageState extends State<AbrirCaixaPage> {
  late final AbrirCaixaCubit _cubit = getIt<AbrirCaixaCubit>();
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();

  @override
  void dispose() {
    _cubit.close();
    _amountController.dispose();
    super.dispose();
  }

  void _submit() {
    if (_formKey.currentState?.validate() ?? false) {
      _cubit.submit(
        valorAberturaCents: parseReaisToCents(_amountController.text) ?? 0,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.caixaOpenTitle)),
      body: BlocConsumer<AbrirCaixaCubit, AbrirCaixaState>(
        bloc: _cubit,
        listener: (context, state) {
          if (state.status == AbrirCaixaStatus.success) {
            AppToast.show(context, l10n.caixaOpenedToast);
            Navigator.of(context).pop(true);
          } else if (state.status == AbrirCaixaStatus.failure) {
            AppToast.error(context, l10n.caixaError(state.errorCode));
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
                    controller: _amountController,
                    enabled: !state.isSubmitting,
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    decoration: InputDecoration(
                      labelText: l10n.caixaOpeningAmountLabel,
                    ),
                    validator: (v) {
                      if ((v?.trim().isEmpty ?? true)) {
                        return l10n.caixaOpeningAmountRequired;
                      }
                      final cents = parseReaisToCents(v!);
                      if (cents == null) {
                        return l10n.caixaOpeningAmountInvalid;
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  PrimaryButton(
                    label: l10n.caixaOpenAction,
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
