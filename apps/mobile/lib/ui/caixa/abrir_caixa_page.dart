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
///
/// On load it pre-checks for an already-open session; when one exists the form
/// is blocked and the operator is led to the active session instead (the API
/// stays authoritative with `CAIXA_JA_ABERTO` on submit).
class AbrirCaixaPage extends StatefulWidget {
  const AbrirCaixaPage({super.key, this.onGoToActiveSession});

  /// Navigates to the already-open session found by the preventive check.
  final void Function(String sessaoId)? onGoToActiveSession;

  @override
  State<AbrirCaixaPage> createState() => _AbrirCaixaPageState();
}

class _AbrirCaixaPageState extends State<AbrirCaixaPage> {
  late final AbrirCaixaCubit _cubit = getIt<AbrirCaixaCubit>();
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _cubit.checkOpenSession();
  }

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
          if (state.isChecking) {
            return const Center(child: CircularProgressIndicator());
          }
          if (state.isBlocked && state.activeSession != null) {
            return _AlreadyOpenBlock(
              onGoToSession: () =>
                  widget.onGoToActiveSession?.call(state.activeSession!.id),
            );
          }
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

/// Blocked state shown when the operator already has an open session: no form,
/// just a path to the active session.
class _AlreadyOpenBlock extends StatelessWidget {
  const _AlreadyOpenBlock({required this.onGoToSession});

  final VoidCallback onGoToSession;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Icon(Icons.lock_outline, size: 64, color: theme.colorScheme.primary),
          const SizedBox(height: AppSpacing.md),
          Text(
            l10n.caixaAlreadyOpenTitle,
            textAlign: TextAlign.center,
            style: theme.textTheme.titleLarge,
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            l10n.caixaAlreadyOpenMessage,
            textAlign: TextAlign.center,
            style: theme.textTheme.bodyMedium,
          ),
          const SizedBox(height: AppSpacing.lg),
          PrimaryButton(
            label: l10n.caixaGoToSessionAction,
            onPressed: onGoToSession,
          ),
        ],
      ),
    );
  }
}
