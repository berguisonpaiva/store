import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../app/di/injector.dart';
import '../../domain/vendas/entities/venda_entity.dart';
import '../../l10n/app_localizations.dart';
import '../theme/app_spacing.dart';
import 'vendas_l10n.dart';
import 'view_model/venda_detail_cubit.dart';
import 'view_model/venda_detail_state.dart';
import 'widgets/pagamento_tile.dart';
import 'widgets/venda_history_status_chip.dart';
import 'widgets/venda_item_tile.dart';
import 'widgets/venda_summary.dart';

/// Read-only detail of a single past sale, opened from the history list. Owns
/// its cubit and loads the sale by id in `initState`.
class VendaDetailPage extends StatefulWidget {
  const VendaDetailPage({super.key, required this.vendaId});

  final String vendaId;

  @override
  State<VendaDetailPage> createState() => _VendaDetailPageState();
}

class _VendaDetailPageState extends State<VendaDetailPage> {
  late final VendaDetailCubit _cubit = getIt<VendaDetailCubit>();

  @override
  void initState() {
    super.initState();
    _cubit.load(widget.vendaId);
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
      appBar: AppBar(title: Text(l10n.vendasHistoryDetailTitle)),
      body: BlocBuilder<VendaDetailCubit, VendaDetailState>(
        bloc: _cubit,
        builder: (context, state) {
          if (state.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          final venda = state.venda;
          if (venda == null) {
            return Center(child: Text(l10n.vendasError(state.errorCode)));
          }
          return _VendaDetailBody(venda: venda);
        },
      ),
    );
  }
}

class _VendaDetailBody extends StatelessWidget {
  const _VendaDetailBody({required this.venda});

  final VendaEntity venda;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final theme = Theme.of(context);
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.md),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              venda.numero != null
                  ? l10n.vendasHistoryNumber(venda.numero!)
                  : venda.id,
              style: theme.textTheme.titleMedium,
            ),
            VendaHistoryStatusChip(status: venda.status),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        Text(l10n.vendasHistoryItemsSection, style: theme.textTheme.titleSmall),
        for (final item in venda.itens) VendaItemTile(item: item),
        const SizedBox(height: AppSpacing.md),
        VendaSummary(
          subtotalCents: venda.subtotalCents,
          descontoCents: venda.descontoCents,
          totalCents: venda.totalCents,
        ),
        if (venda.pagamentos.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.md),
          Text(
            l10n.vendasHistoryPaymentsSection,
            style: theme.textTheme.titleSmall,
          ),
          for (final pagamento in venda.pagamentos)
            PagamentoTile(pagamento: pagamento),
        ],
      ],
    );
  }
}
