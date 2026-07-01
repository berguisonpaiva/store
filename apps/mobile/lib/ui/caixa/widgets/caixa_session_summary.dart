import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../domain/caixa/entities/sessao_caixa_entity.dart';
import '../../../l10n/app_localizations.dart';
import '../../shared/widgets/primary_button.dart';
import '../../theme/app_spacing.dart';
import '../caixa_l10n.dart';

/// Compact card shown on the status screen when a session is open, with a CTA
/// to open the active-session detail.
class CaixaSessionSummary extends StatelessWidget {
  const CaixaSessionSummary({
    super.key,
    required this.session,
    required this.onOpenSession,
  });

  final SessaoCaixaEntity session;
  final VoidCallback onOpenSession;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final openedAt = DateFormat.yMd(
      l10n.localeName,
    ).add_Hm().format(session.abertaEm);

    return Padding(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l10n.caixaActiveTitle,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text('${l10n.caixaSummaryOpening}: '
                      '${l10n.formatMoney(session.valorAberturaCents)}'),
                  const SizedBox(height: AppSpacing.xs),
                  Text(openedAt),
                ],
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          PrimaryButton(label: l10n.caixaActiveTitle, onPressed: onOpenSession),
        ],
      ),
    );
  }
}
