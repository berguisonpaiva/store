import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../domain/caixa/entities/movimentacao_caixa_entity.dart';
import '../../../l10n/app_localizations.dart';
import '../caixa_l10n.dart';

/// A single cash-session movement row.
class MovimentacaoTile extends StatelessWidget {
  const MovimentacaoTile({super.key, required this.movimentacao});

  final MovimentacaoCaixaEntity movimentacao;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final dateLabel = DateFormat.yMd(
      l10n.localeName,
    ).add_Hm().format(movimentacao.criadaEm);

    return ListTile(
      title: Text(l10n.caixaMovementType(movimentacao.tipo)),
      subtitle: movimentacao.observacao == null
          ? Text(dateLabel)
          : Text('${movimentacao.observacao} · $dateLabel'),
      trailing: Text(l10n.formatMoney(movimentacao.valorCents)),
    );
  }
}
