import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/vendas/entities/forma_pagamento.dart';
import '../../domain/vendas/repositories/vendas_repository.dart';
import '../../l10n/app_localizations.dart';
import '../caixa/money_input.dart';
import '../shared/feedback/app_toast.dart';
import '../theme/app_spacing.dart';
import 'vendas_l10n.dart';
import 'view_model/venda_pdv_cubit.dart';
import 'view_model/venda_pdv_state.dart';
import 'widgets/pagamento_row.dart';

/// Mutable payment leg backing one [PagamentoRow].
class _PaymentLeg {
  _PaymentLeg(this.forma) : controller = TextEditingController();

  FormaPagamento forma;
  final TextEditingController controller;
}

/// Payment step of the PDV flow. Captures one or more payment legs and blocks
/// the confirm action until the legs sum exactly to the sale total. On success
/// it pops `true`; on `PaymentMismatch` it shows blocked feedback.
class FinalizarVendaView extends StatefulWidget {
  const FinalizarVendaView({
    super.key,
    required this.cubit,
    required this.totalCents,
  });

  final VendaPdvCubit cubit;
  final int totalCents;

  @override
  State<FinalizarVendaView> createState() => _FinalizarVendaViewState();
}

class _FinalizarVendaViewState extends State<FinalizarVendaView> {
  late final List<_PaymentLeg> _legs;

  @override
  void initState() {
    super.initState();
    // Seed with a single cash leg prefilled to the total for the common case.
    final first = _PaymentLeg(FormaPagamento.dinheiro);
    first.controller.text = (widget.totalCents / 100).toStringAsFixed(2);
    _legs = [first];
  }

  @override
  void dispose() {
    for (final leg in _legs) {
      leg.controller.dispose();
    }
    super.dispose();
  }

  int get _paidCents => _legs.fold(0, (acc, leg) {
    final cents = parseReaisToCents(leg.controller.text) ?? 0;
    return acc + cents;
  });

  int get _remainingCents => widget.totalCents - _paidCents;

  bool get _matches => _remainingCents == 0 && _paidCents > 0;

  void _addLeg() {
    setState(() => _legs.add(_PaymentLeg(FormaPagamento.dinheiro)));
  }

  void _removeLeg(_PaymentLeg leg) {
    setState(() {
      _legs.remove(leg);
      leg.controller.dispose();
    });
  }

  void _confirm() {
    final pagamentos = [
      for (final leg in _legs)
        PagamentoInput(
          forma: leg.forma,
          valorCents: parseReaisToCents(leg.controller.text) ?? 0,
        ),
    ];
    widget.cubit.finalizar(pagamentos);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.vendasFinalizeTitle)),
      body: BlocConsumer<VendaPdvCubit, VendaPdvState>(
        bloc: widget.cubit,
        listenWhen: (prev, curr) => prev.opStatus != curr.opStatus,
        listener: (context, state) {
          if (state.opStatus == VendaOpStatus.success &&
              (state.venda?.isFinalized ?? false)) {
            AppToast.show(context, l10n.vendasFinalizedToast);
            Navigator.of(context).pop(true);
          } else if (state.opStatus == VendaOpStatus.failure) {
            AppToast.error(context, l10n.vendasError(state.opErrorCode));
          }
        },
        builder: (context, state) {
          return ListView(
            padding: const EdgeInsets.all(AppSpacing.md),
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(l10n.vendasTotal, style: theme.textTheme.titleMedium),
                  Text(
                    l10n.formatVendaMoney(widget.totalCents),
                    style: theme.textTheme.titleMedium,
                  ),
                ],
              ),
              const Divider(height: AppSpacing.lg),
              for (final leg in _legs)
                PagamentoRow(
                  key: ObjectKey(leg),
                  forma: leg.forma,
                  controller: leg.controller,
                  onFormaChanged: (f) => setState(() => leg.forma = f),
                  onChanged: () => setState(() {}),
                  onRemove: _legs.length > 1 ? () => _removeLeg(leg) : () {},
                ),
              const SizedBox(height: AppSpacing.sm),
              Align(
                alignment: Alignment.centerLeft,
                child: TextButton.icon(
                  icon: const Icon(Icons.add),
                  label: Text(l10n.vendasPaymentAddAction),
                  onPressed: _addLeg,
                ),
              ),
              const Divider(height: AppSpacing.lg),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(l10n.vendasRemaining),
                  Text(l10n.formatVendaMoney(_remainingCents)),
                ],
              ),
              const SizedBox(height: AppSpacing.lg),
              FilledButton(
                onPressed: _matches && !state.isSubmitting ? _confirm : null,
                child: state.isSubmitting
                    ? const SizedBox(
                        height: 18,
                        width: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(l10n.vendasFinalizeConfirm),
              ),
              if (!_matches)
                Padding(
                  padding: const EdgeInsets.only(top: AppSpacing.sm),
                  child: Text(
                    l10n.vendasFinalizeBlocked,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.error,
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}
