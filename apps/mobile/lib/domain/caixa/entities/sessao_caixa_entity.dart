import 'package:equatable/equatable.dart';

import 'cash_session_status.dart';

/// A cash session (`caixa`) opened by an operator.
///
/// Monetary fields are integer amounts in cents; the HTTP edge speaks reais and
/// the data layer converts at the boundary. Formatting to a currency string
/// happens only in the UI layer.
class SessaoCaixaEntity extends Equatable {
  const SessaoCaixaEntity({
    required this.id,
    required this.status,
    required this.valorAberturaCents,
    required this.abertaEm,
    this.operadorId,
    this.valorFechamentoCents,
    this.fechadaEm,
  });

  final String id;
  final CashSessionStatus status;

  /// Opening float, in cents.
  final int valorAberturaCents;
  final DateTime abertaEm;

  /// Server-derived operator id. Never sent by the client.
  final String? operadorId;

  /// Counted closing amount, in cents (null while the session is open).
  final int? valorFechamentoCents;
  final DateTime? fechadaEm;

  bool get isOpen => status == CashSessionStatus.aberto;

  @override
  List<Object?> get props => [
    id,
    status,
    valorAberturaCents,
    abertaEm,
    operadorId,
    valorFechamentoCents,
    fechadaEm,
  ];
}
