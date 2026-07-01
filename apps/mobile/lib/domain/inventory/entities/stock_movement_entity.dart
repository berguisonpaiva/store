import 'package:equatable/equatable.dart';

import 'stock_movement_reason.dart';
import 'stock_movement_type.dart';

/// A single immutable ledger entry for a variation.
class StockMovementEntity extends Equatable {
  const StockMovementEntity({
    required this.id,
    required this.variacaoId,
    required this.tipo,
    required this.motivo,
    required this.quantidade,
    required this.saldoResultante,
    required this.criadoEm,
    this.origemVendaId,
  });

  final String id;
  final String variacaoId;
  final StockMovementType tipo;
  final StockMovementReason motivo;
  final int quantidade;
  final int saldoResultante;
  final DateTime criadoEm;
  final String? origemVendaId;

  @override
  List<Object?> get props => [
    id,
    variacaoId,
    tipo,
    motivo,
    quantidade,
    saldoResultante,
    criadoEm,
    origemVendaId,
  ];
}
