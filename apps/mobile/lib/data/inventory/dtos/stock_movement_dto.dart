import '../../../domain/inventory/entities/stock_movement_entity.dart';
import '../../../domain/inventory/entities/stock_movement_reason.dart';
import '../../../domain/inventory/entities/stock_movement_type.dart';

/// Wire model for a single ledger movement.
class StockMovementDto {
  const StockMovementDto({
    required this.id,
    required this.variacaoId,
    required this.tipo,
    required this.motivo,
    required this.quantidade,
    required this.saldoResultante,
    required this.timestamp,
    this.origemVendaId,
  });

  factory StockMovementDto.fromJson(Map<String, dynamic> json) =>
      StockMovementDto(
        id: json['id'] as String,
        variacaoId: json['variacaoId'] as String,
        tipo: json['tipo'] as String,
        motivo: json['motivo'] as String,
        quantidade: (json['quantidade'] as num).toInt(),
        saldoResultante: (json['saldoResultante'] as num).toInt(),
        timestamp: json['timestamp'] as String,
        origemVendaId: json['origemVendaId'] as String?,
      );

  final String id;
  final String variacaoId;
  final String tipo;
  final String motivo;
  final int quantidade;
  final int saldoResultante;
  final String timestamp;
  final String? origemVendaId;

  StockMovementEntity toEntity() => StockMovementEntity(
    id: id,
    variacaoId: variacaoId,
    tipo: StockMovementType.fromWire(tipo),
    motivo: StockMovementReason.fromWire(motivo),
    quantidade: quantidade,
    saldoResultante: saldoResultante,
    criadoEm: DateTime.parse(timestamp).toLocal(),
    origemVendaId: origemVendaId,
  );
}
