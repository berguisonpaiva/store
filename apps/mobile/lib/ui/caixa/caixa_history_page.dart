import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../app/di/injector.dart';
import '../../domain/caixa/entities/cash_session_status.dart';
import '../../l10n/app_localizations.dart';
import '../shared/feedback/app_toast.dart';
import '../theme/app_spacing.dart';
import 'caixa_l10n.dart';
import 'view_model/caixa_history_cubit.dart';
import 'view_model/caixa_history_state.dart';
import 'widgets/sessao_history_tile.dart';

/// The operator's own cash-session history (RN03). The backend scopes
/// `GET /caixa/minhas` to the caller, so this never shows other operators'
/// sessions. Owns its cubit and loads on first build; a status filter narrows
/// the list.
class CaixaHistoryPage extends StatefulWidget {
  const CaixaHistoryPage({super.key, required this.onOpenSessao});

  /// Navigates to the read-only detail of a session by id.
  final void Function(String sessaoId) onOpenSessao;

  @override
  State<CaixaHistoryPage> createState() => _CaixaHistoryPageState();
}

class _CaixaHistoryPageState extends State<CaixaHistoryPage> {
  late final CaixaHistoryCubit _cubit = getIt<CaixaHistoryCubit>();

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
      appBar: AppBar(title: Text(l10n.caixaHistoryTitle)),
      body: BlocConsumer<CaixaHistoryCubit, CaixaHistoryState>(
        bloc: _cubit,
        listener: (context, state) {
          if (state.status == CaixaHistoryStatus.error) {
            AppToast.error(context, l10n.caixaError(state.errorCode));
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
    CaixaHistoryState state,
    AppLocalizations l10n,
  ) {
    if (state.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (state.isEmpty) {
      return Center(child: Text(l10n.caixaHistoryEmpty));
    }
    return RefreshIndicator(
      onRefresh: () => _cubit.load(status: state.filtroStatus),
      child: ListView.builder(
        itemCount: state.sessoes.length,
        itemBuilder: (context, i) {
          final sessao = state.sessoes[i];
          return SessaoHistoryTile(
            sessao: sessao,
            onTap: () => widget.onOpenSessao(sessao.id),
          );
        },
      ),
    );
  }
}

/// Segmented status filter: "all" plus one chip per [CashSessionStatus].
class _StatusFilter extends StatelessWidget {
  const _StatusFilter({required this.selected, required this.onChanged});

  final CashSessionStatus? selected;
  final ValueChanged<CashSessionStatus?> onChanged;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Wrap(
      spacing: AppSpacing.sm,
      children: [
        ChoiceChip(
          label: Text(l10n.caixaHistoryFilterAll),
          selected: selected == null,
          onSelected: (_) => onChanged(null),
        ),
        for (final status in CashSessionStatus.values)
          ChoiceChip(
            label: Text(l10n.caixaSessionStatus(status)),
            selected: selected == status,
            onSelected: (_) => onChanged(status),
          ),
      ],
    );
  }
}
