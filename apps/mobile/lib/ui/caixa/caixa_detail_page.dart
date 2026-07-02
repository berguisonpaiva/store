import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';

import '../../app/di/injector.dart';
import '../../domain/caixa/entities/sessao_caixa_entity.dart';
import '../../l10n/app_localizations.dart';
import '../theme/app_spacing.dart';
import 'caixa_l10n.dart';
import 'view_model/caixa_detail_cubit.dart';
import 'view_model/caixa_detail_state.dart';
import 'widgets/caixa_session_status_chip.dart';
import 'widgets/movimentacao_tile.dart';
import 'widgets/resumo_card.dart';

/// Read-only detail of a single cash session, opened from the history list:
/// session data, resumo and movements — no controls to alter the session.
/// Owns its cubit and loads the session by id in `initState`.
class CaixaDetailPage extends StatefulWidget {
  const CaixaDetailPage({super.key, required this.sessaoId});

  final String sessaoId;

  @override
  State<CaixaDetailPage> createState() => _CaixaDetailPageState();
}

class _CaixaDetailPageState extends State<CaixaDetailPage> {
  late final CaixaDetailCubit _cubit = getIt<CaixaDetailCubit>();

  @override
  void initState() {
    super.initState();
    _cubit.load(widget.sessaoId);
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
      appBar: AppBar(title: Text(l10n.caixaHistoryDetailTitle)),
      body: BlocBuilder<CaixaDetailCubit, CaixaDetailState>(
        bloc: _cubit,
        builder: (context, state) {
          if (state.isLoading || state.status == CaixaDetailStatus.idle) {
            return const Center(child: CircularProgressIndicator());
          }
          final sessao = state.sessao;
          if (sessao == null) {
            return Center(child: Text(l10n.caixaError(state.errorCode)));
          }
          return ListView(
            padding: const EdgeInsets.all(AppSpacing.md),
            children: [
              _SessaoCard(sessao: sessao),
              if (state.resumo != null) ...[
                const SizedBox(height: AppSpacing.md),
                ResumoCard(resumo: state.resumo!),
              ],
              const SizedBox(height: AppSpacing.lg),
              Text(
                l10n.caixaMovementsTitle,
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: AppSpacing.sm),
              if (state.movimentacoes.isEmpty)
                Text(
                  l10n.caixaEmptyMovements,
                  style: Theme.of(context).textTheme.bodyMedium,
                )
              else
                for (final m in state.movimentacoes)
                  MovimentacaoTile(movimentacao: m),
            ],
          );
        },
      ),
    );
  }
}

/// Read-only card with the session data: status, opening/closing amounts and
/// timestamps.
class _SessaoCard extends StatelessWidget {
  const _SessaoCard({required this.sessao});

  final SessaoCaixaEntity sessao;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final theme = Theme.of(context);
    final dateFormat = DateFormat.yMd(l10n.localeName).add_Hm();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  l10n.caixaDetailSessionTitle,
                  style: theme.textTheme.titleMedium,
                ),
                CaixaSessionStatusChip(status: sessao.status),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              '${l10n.caixaOpeningAmountLabel}: '
              '${l10n.formatMoney(sessao.valorAberturaCents)}',
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              '${l10n.caixaDetailOpenedAt} '
              '${dateFormat.format(sessao.abertaEm)}',
            ),
            if (sessao.valorFechamentoCents != null) ...[
              const SizedBox(height: AppSpacing.xs),
              Text(
                '${l10n.caixaDetailClosingAmount}: '
                '${l10n.formatMoney(sessao.valorFechamentoCents!)}',
              ),
            ],
            if (sessao.fechadaEm != null) ...[
              const SizedBox(height: AppSpacing.xs),
              Text(
                '${l10n.caixaDetailClosedAt} '
                '${dateFormat.format(sessao.fechadaEm!)}',
              ),
            ],
          ],
        ),
      ),
    );
  }
}
