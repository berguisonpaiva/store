import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/caixa/usecases/fechar_caixa_usecase.dart';
import '../../app/di/injector.dart';
import '../../l10n/app_localizations.dart';
import '../shared/feedback/app_confirm_dialog.dart';
import '../shared/feedback/app_toast.dart';
import '../shared/widgets/primary_button.dart';
import '../theme/app_spacing.dart';
import 'caixa_l10n.dart';
import 'money_input.dart';
import 'view_model/fechar_caixa_cubit.dart';
import 'view_model/fechar_caixa_state.dart';
import 'widgets/divergencia_card.dart';

/// Arguments for the close-cash route.
class FecharCaixaArgs {
  const FecharCaixaArgs({required this.sessaoId, required this.esperadoCents});

  final String sessaoId;
  final int esperadoCents;
}

/// Closes a cash session: the operator enters the counted amount, sees
/// expected/counted/divergence, and confirms before closing.
class FecharCaixaPage extends StatefulWidget {
  const FecharCaixaPage({super.key, required this.args});

  final FecharCaixaArgs args;

  @override
  State<FecharCaixaPage> createState() => _FecharCaixaPageState();
}

class _FecharCaixaPageState extends State<FecharCaixaPage> {
  late final FecharCaixaCubit _cubit = FecharCaixaCubit(
    fecharCaixa: getIt<FecharCaixaUseCase>(),
    esperadoCents: widget.args.esperadoCents,
  );
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();

  @override
  void dispose() {
    _cubit.close();
    _amountController.dispose();
    super.dispose();
  }

  void _onAmountChanged(String raw) =>
      _cubit.contadoChanged(parseReaisToCents(raw));

  Future<void> _confirmAndClose() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    final l10n = AppLocalizations.of(context)!;
    final confirmed = await AppConfirmDialog.show(
      context,
      title: l10n.caixaCloseConfirmTitle,
      message: l10n.caixaCloseConfirmMessage,
      confirmLabel: l10n.caixaCloseConfirmAction,
      cancelLabel: l10n.caixaCancelAction,
      destructive: true,
    );
    if (confirmed) {
      await _cubit.submit(sessaoId: widget.args.sessaoId);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.caixaCloseTitle)),
      body: BlocConsumer<FecharCaixaCubit, FecharCaixaState>(
        bloc: _cubit,
        listener: (context, state) {
          if (state.status == FecharCaixaStatus.success) {
            AppToast.show(context, l10n.caixaClosedToast);
            Navigator.of(context).pop(true);
          } else if (state.status == FecharCaixaStatus.failure) {
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
                      labelText: l10n.caixaCountedAmountLabel,
                    ),
                    onChanged: _onAmountChanged,
                    validator: (v) {
                      if (v?.trim().isEmpty ?? true) {
                        return l10n.caixaCountedAmountRequired;
                      }
                      final cents = parseReaisToCents(v!);
                      if (cents == null) {
                        return l10n.caixaCountedAmountInvalid;
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: AppSpacing.md),
                  DivergenciaCard(
                    esperadoCents: state.esperadoCents,
                    contadoCents: state.contadoCents,
                    divergenciaCents: state.divergenciaCents,
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  PrimaryButton(
                    label: l10n.caixaCloseAction,
                    isLoading: state.isSubmitting,
                    onPressed: _confirmAndClose,
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
