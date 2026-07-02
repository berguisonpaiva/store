import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../domain/caixa/entities/sessao_caixa_entity.dart';
import '../../../l10n/app_localizations.dart';
import '../../theme/app_spacing.dart';
import '../caixa_l10n.dart';
import 'caixa_session_status_chip.dart';

/// A single cash session row in the operator's history list: opening date,
/// status badge, close date (when closed) and opening amount. Tapping opens
/// the read-only session detail.
class SessaoHistoryTile extends StatelessWidget {
  const SessaoHistoryTile({super.key, required this.sessao, this.onTap});

  final SessaoCaixaEntity sessao;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final theme = Theme.of(context);
    final dateFormat = DateFormat.yMd(l10n.localeName).add_Hm();
    final openedAt = dateFormat.format(sessao.abertaEm);
    final closedAt = sessao.fechadaEm == null
        ? null
        : dateFormat.format(sessao.fechadaEm!);

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
      title: Text(openedAt, maxLines: 1, overflow: TextOverflow.ellipsis),
      subtitle: Row(
        children: [
          CaixaSessionStatusChip(status: sessao.status),
          if (closedAt != null) ...[
            const SizedBox(width: AppSpacing.sm),
            Flexible(
              child: Text(
                '${l10n.caixaDetailClosedAt} $closedAt',
                style: theme.textTheme.bodySmall,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ],
      ),
      trailing: Text(
        l10n.formatMoney(sessao.valorAberturaCents),
        style: theme.textTheme.titleSmall,
      ),
      onTap: onTap,
    );
  }
}
