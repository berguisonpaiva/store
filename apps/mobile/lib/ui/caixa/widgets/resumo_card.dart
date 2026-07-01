import 'package:flutter/material.dart';

import '../../../domain/caixa/entities/resumo_sessao_entity.dart';
import '../../../l10n/app_localizations.dart';
import '../../theme/app_spacing.dart';
import '../caixa_l10n.dart';

/// Shows the aggregated totals of a cash session.
class ResumoCard extends StatelessWidget {
  const ResumoCard({super.key, required this.resumo});

  final ResumoSessaoEntity resumo;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final textTheme = Theme.of(context).textTheme;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(l10n.caixaSummaryTitle, style: textTheme.titleMedium),
            const SizedBox(height: AppSpacing.sm),
            _Row(label: l10n.caixaSummaryOpening, value: l10n.formatMoney(resumo.aberturaCents)),
            _Row(label: l10n.caixaSummarySupplies, value: l10n.formatMoney(resumo.suprimentosCents)),
            _Row(label: l10n.caixaSummaryCashSales, value: l10n.formatMoney(resumo.vendasDinheiroCents)),
            _Row(label: l10n.caixaSummaryWithdrawals, value: l10n.formatMoney(resumo.sangriasCents)),
            const Divider(),
            _Row(
              label: l10n.caixaSummaryExpected,
              value: l10n.formatMoney(resumo.esperadoCents),
              emphasize: true,
            ),
            if (resumo.contadoCents != null)
              _Row(
                label: l10n.caixaSummaryCounted,
                value: l10n.formatMoney(resumo.contadoCents!),
              ),
            if (resumo.divergenciaCents != null)
              _Row(
                label: l10n.caixaSummaryDivergence,
                value: l10n.formatMoney(resumo.divergenciaCents!),
              ),
          ],
        ),
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.label, required this.value, this.emphasize = false});

  final String label;
  final String value;
  final bool emphasize;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final style = emphasize ? textTheme.titleMedium : textTheme.bodyMedium;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: style),
          Text(value, style: style),
        ],
      ),
    );
  }
}
