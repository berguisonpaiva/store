import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../app/di/injector.dart';
import '../../domain/vendas/entities/status_venda.dart';
import '../../l10n/app_localizations.dart';
import '../shared/feedback/app_toast.dart';
import '../theme/app_spacing.dart';
import 'vendas_l10n.dart';
import 'view_model/vendas_history_cubit.dart';
import 'view_model/vendas_history_state.dart';
import 'widgets/venda_history_tile.dart';

/// The operator's own sales history (RN03). The backend scopes `GET /vendas` to
/// the caller, so this never shows other operators' sales. Owns its cubit and
/// loads on first build; a status filter narrows the list.
class VendasHistoryPage extends StatefulWidget {
  const VendasHistoryPage({super.key, required this.onOpenVenda});

  /// Navigates to the read-only detail of a sale by id.
  final void Function(String vendaId) onOpenVenda;

  @override
  State<VendasHistoryPage> createState() => _VendasHistoryPageState();
}

class _VendasHistoryPageState extends State<VendasHistoryPage> {
  late final VendasHistoryCubit _cubit = getIt<VendasHistoryCubit>();

  @override
  void initState() {
    super.initState();
    _cubit.load();
  }

  @override
  void dispose() {
    _cubit.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.vendasHistoryTitle)),
      body: BlocConsumer<VendasHistoryCubit, VendasHistoryState>(
        bloc: _cubit,
        listener: (context, state) {
          if (state.status == VendasHistoryStatus.error) {
            AppToast.error(context, l10n.vendasError(state.errorCode));
          }
        },
        builder: (context, state) {
          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: _StatusFilter(
                  selected: state.filtroStatus,
                  onChanged: _cubit.filterByStatus,
                ),
              ),
              const Divider(height: 1),
              Expanded(child: _body(context, state, l10n)),
            ],
          );
        },
      ),
    );
  }

  Widget _body(
    BuildContext context,
    VendasHistoryState state,
    AppLocalizations l10n,
  ) {
    if (state.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (state.isEmpty) {
      return Center(child: Text(l10n.vendasHistoryEmpty));
    }
    return RefreshIndicator(
      onRefresh: () => _cubit.load(status: state.filtroStatus),
      child: ListView.builder(
        itemCount: state.vendas.length,
        itemBuilder: (context, i) {
          final venda = state.vendas[i];
          return VendaHistoryTile(
            venda: venda,
            onTap: () => widget.onOpenVenda(venda.id),
          );
        },
      ),
    );
  }
}

/// Segmented status filter: "all" plus one chip per [StatusVenda].
class _StatusFilter extends StatelessWidget {
  const _StatusFilter({required this.selected, required this.onChanged});

  final StatusVenda? selected;
  final ValueChanged<StatusVenda?> onChanged;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Wrap(
      spacing: AppSpacing.sm,
      children: [
        ChoiceChip(
          label: Text(l10n.vendasHistoryFilterAll),
          selected: selected == null,
          onSelected: (_) => onChanged(null),
        ),
        for (final status in StatusVenda.values)
          ChoiceChip(
            label: Text(l10n.vendasStatus(status)),
            selected: selected == status,
            onSelected: (_) => onChanged(status),
          ),
      ],
    );
  }
}
