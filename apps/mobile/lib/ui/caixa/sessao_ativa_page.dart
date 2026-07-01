import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../app/di/injector.dart';
import '../../l10n/app_localizations.dart';
import '../shared/feedback/app_toast.dart';
import '../theme/app_spacing.dart';
import 'caixa_l10n.dart';
import 'fechar_caixa_page.dart';
import 'view_model/sessao_ativa_cubit.dart';
import 'view_model/sessao_ativa_state.dart';
import 'widgets/cash_movement_sheet.dart';
import 'widgets/movimentacao_tile.dart';
import 'widgets/resumo_card.dart';
import 'widgets/sessao_ativa_actions.dart';

/// Active cash session: summary, movements and the sangria/suprimento/fechar
/// actions.
class SessaoAtivaPage extends StatefulWidget {
  const SessaoAtivaPage({super.key, required this.sessaoId});

  final String sessaoId;

  @override
  State<SessaoAtivaPage> createState() => _SessaoAtivaPageState();
}

class _SessaoAtivaPageState extends State<SessaoAtivaPage> {
  late final SessaoAtivaCubit _cubit = getIt<SessaoAtivaCubit>();

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

  Future<void> _sangria() async {
    final l10n = AppLocalizations.of(context)!;
    final input = await CashMovementSheet.show(
      context,
      title: l10n.caixaWithdrawalTitle,
    );
    if (input == null) return;
    await _cubit.registrarSangria(
      sessaoId: widget.sessaoId,
      valorCents: input.valorCents,
      observacao: input.observacao,
    );
  }

  Future<void> _suprimento() async {
    final l10n = AppLocalizations.of(context)!;
    final input = await CashMovementSheet.show(
      context,
      title: l10n.caixaSupplyTitle,
    );
    if (input == null) return;
    await _cubit.registrarSuprimento(
      sessaoId: widget.sessaoId,
      valorCents: input.valorCents,
      observacao: input.observacao,
    );
  }

  Future<void> _fechar(int esperadoCents) async {
    final closed = await context.push<bool>(
      '/caixa/fechar',
      extra: FecharCaixaArgs(sessaoId: widget.sessaoId, esperadoCents: esperadoCents),
    );
    if (closed == true && mounted) {
      Navigator.of(context).pop(true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.caixaActiveTitle)),
      body: BlocConsumer<SessaoAtivaCubit, SessaoAtivaState>(
        bloc: _cubit,
        listener: (context, state) {
          if (state.opStatus == CashOpStatus.failure) {
            AppToast.error(context, l10n.caixaError(state.opErrorCode));
          }
        },
        builder: (context, state) {
          if (state.isLoading || state.status == SessaoAtivaStatus.idle) {
            return const Center(child: CircularProgressIndicator());
          }
          final resumo = state.resumo;
          return ListView(
            padding: const EdgeInsets.all(AppSpacing.md),
            children: [
              if (resumo != null) ResumoCard(resumo: resumo),
              const SizedBox(height: AppSpacing.md),
              SessaoAtivaActions(
                enabled: !state.isSubmittingOp,
                onSangria: _sangria,
                onSuprimento: _suprimento,
                onFechar: resumo == null
                    ? null
                    : () => _fechar(resumo.esperadoCents),
              ),
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
