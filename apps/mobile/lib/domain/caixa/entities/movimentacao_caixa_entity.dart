import 'package:equatable/equatable.dart';

import 'cash_movement_type.dart';

/// A single immutable cash-session movement (abertura, suprimento, sangria,
/// venda em dinheiro, fechamento).
///
/// [valorCents] is an integer amount in cents.
class MovimentacaoCaixaEntity extends Equatable {
  const MovimentacaoCaixaEntity({
    required this.id,
    required this.tipo,
    required this.valorCents,
    required this.criadaEm,
    this.observacao,
  });

  final String id;
  final CashMovementType tipo;
  final int valorCents;
  final DateTime criadaEm;
  final String? observacao;

  @override
  List<Object?> get props => [id, tipo, valorCents, criadaEm, observacao];
}
