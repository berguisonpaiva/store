import 'package:flutter/material.dart';

import '../../../domain/vendas/entities/pagamento_entity.dart';
import '../../../l10n/app_localizations.dart';
import '../../theme/app_spacing.dart';
import '../vendas_l10n.dart';

/// Read-only display of a recorded payment leg: method and amount.
class PagamentoTile extends StatelessWidget {
  const PagamentoTile({super.key, required this.pagamento});

  final PagamentoEntity pagamento;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final theme = Theme.of(context);
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
      dense: true,
      leading: const Icon(Icons.payments_outlined),
      title: Text(l10n.vendasFormaPagamento(pagamento.forma)),
      trailing: Text(
        l10n.formatVendaMoney(pagamento.valorCents),
        style: theme.textTheme.titleSmall,
      ),
    );
  }
}
