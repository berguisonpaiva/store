import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../l10n/app_localizations.dart';
import '../shared/feedback/app_confirm_dialog.dart';
import '../shared/feedback/app_toast.dart';
import '../shared/widgets/primary_button.dart';
import '../theme/app_spacing.dart';
import 'finalizar_venda_view.dart';
import 'vendas_l10n.dart';
import 'view_model/venda_pdv_cubit.dart';
import 'view_model/venda_pdv_state.dart';
import 'widgets/desconto_sheet.dart';
import 'widgets/venda_bip_field.dart';
import 'widgets/venda_item_tile.dart';
import 'widgets/venda_pdv_actions.dart';
import 'widgets/venda_summary.dart';

/// PDV counter-sale screen. Receives its [VendaPdvCubit] by constructor and an
/// [onOpenCash] navigation callback. Renders bip field, item list, totals and
/// actions; blocks when there is no open cash session and is read-only once the
/// sale is finalized.
class VendaPdvView extends StatelessWidget {
  const VendaPdvView({
    super.key,
    required this.viewModel,
    required this.onOpenCash,
  });

  final VendaPdvCubit viewModel;
  final VoidCallback onOpenCash;

  Future<void> _onBip(
    BuildContext context,
    String code, {
    required bool isSku,
  }) async {
    await viewModel.bip(code: code, isSku: isSku);
  }

  Future<void> _onRemoveItem(BuildContext context, String itemId) async {
    final l10n = AppLocalizations.of(context)!;
    final confirmed = await AppConfirmDialog.show(
      context,
      title: l10n.vendasRemoveItemConfirmTitle,
      message: l10n.vendasRemoveItemConfirmMessage,
      confirmLabel: l10n.vendasRemoveItemConfirmAction,
      cancelLabel: l10n.vendasKeepEditing,
      destructive: true,
    );
    if (confirmed) await viewModel.removerItem(itemId);
  }

  Future<void> _onDiscount(BuildContext context) async {
    final input = await DescontoSheet.show(
      context,
      subtotalCents: viewModel.state.subtotalCents,
    );
    if (input == null) return;
    await viewModel.aplicarDesconto(tipo: input.tipo, valor: input.valor);
  }

  Future<void> _onCancel(BuildContext context) async {
    final l10n = AppLocalizations.of(context)!;
    final confirmed = await AppConfirmDialog.show(
      context,
      title: l10n.vendasCancelConfirmTitle,
      message: l10n.vendasCancelConfirmMessage,
      confirmLabel: l10n.vendasCancelConfirmAction,
      cancelLabel: l10n.vendasKeepEditing,
      destructive: true,
    );
    if (confirmed) await viewModel.cancelar();
  }

  Future<void> _onFinalize(BuildContext context) async {
    await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => FinalizarVendaView(
          cubit: viewModel,
          totalCents: viewModel.state.totalCents,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.vendasPdvTitle)),
      body: BlocConsumer<VendaPdvCubit, VendaPdvState>(
        bloc: viewModel,
        listenWhen: (prev, curr) => prev.opStatus != curr.opStatus,
        listener: (context, state) {
          if (state.opStatus == VendaOpStatus.failure) {
            AppToast.error(context, l10n.vendasError(state.opErrorCode));
          } else if (state.opStatus == VendaOpStatus.success &&
              (state.venda?.isCancelled ?? false)) {
            AppToast.show(context, l10n.vendasCancelledToast);
          }
        },
        builder: (context, state) {
          return switch (state.status) {
            VendaPdvStatus.loading => const Center(
              child: CircularProgressIndicator(),
            ),
            VendaPdvStatus.noOpenCashSession => _NoSessionBody(
              onOpenCash: onOpenCash,
            ),
            VendaPdvStatus.error => Center(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.lg),
                child: Text(
                  l10n.vendasError(state.errorCode),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
            VendaPdvStatus.loaded => _LoadedBody(
              state: state,
              onBip: (code, {required bool isSku}) =>
                  _onBip(context, code, isSku: isSku),
              onRemoveItem: (id) => _onRemoveItem(context, id),
              onDiscount: () => _onDiscount(context),
              onCancel: () => _onCancel(context),
              onFinalize: () => _onFinalize(context),
            ),
          };
        },
      ),
    );
  }
}

/// Blocked state shown when the operator has no open cash session.
class _NoSessionBody extends StatelessWidget {
  const _NoSessionBody({required this.onOpenCash});

  final VoidCallback onOpenCash;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Icon(
            Icons.point_of_sale,
            size: 64,
            color: Theme.of(context).colorScheme.primary,
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            l10n.vendasNoSessionTitle,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            l10n.vendasNoSessionMessage,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: AppSpacing.lg),
          PrimaryButton(label: l10n.vendasOpenCashAction, onPressed: onOpenCash),
        ],
      ),
    );
  }
}

/// Editable / read-only sale body: bip field, item list, summary and actions.
class _LoadedBody extends StatelessWidget {
  const _LoadedBody({
    required this.state,
    required this.onBip,
    required this.onRemoveItem,
    required this.onDiscount,
    required this.onCancel,
    required this.onFinalize,
  });

  final VendaPdvState state;
  final void Function(String code, {required bool isSku}) onBip;
  final void Function(String itemId) onRemoveItem;
  final VoidCallback onDiscount;
  final VoidCallback onCancel;
  final VoidCallback onFinalize;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final venda = state.venda!;
    final readOnly = state.isReadOnly;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (readOnly)
          Container(
            width: double.infinity,
            color: Theme.of(context).colorScheme.secondaryContainer,
            padding: const EdgeInsets.all(AppSpacing.sm),
            child: Text(
              l10n.vendasReadOnlyBanner,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          )
        else
          Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: VendaBipField(
              enabled: !state.isSubmitting,
              onSubmit: onBip,
            ),
          ),
        Expanded(
          child: venda.itens.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    child: Text(
                      l10n.vendasEmptyItems,
                      textAlign: TextAlign.center,
                    ),
                  ),
                )
              : ListView(
                  children: [
                    for (final item in venda.itens)
                      VendaItemTile(
                        item: item,
                        onRemove: readOnly || state.isSubmitting
                            ? null
                            : () => onRemoveItem(item.id),
                      ),
                  ],
                ),
        ),
        Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              VendaSummary(
                subtotalCents: state.subtotalCents,
                descontoCents: state.descontoCents,
                totalCents: state.totalCents,
              ),
              if (!readOnly) ...[
                const SizedBox(height: AppSpacing.md),
                VendaPdvActions(
                  enabled: !state.isSubmitting,
                  canFinalize: venda.itens.isNotEmpty,
                  onDiscount: onDiscount,
                  onCancel: onCancel,
                  onFinalize: onFinalize,
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}
