import '../../../domain/inventory/entities/low_stock_item_entity.dart';

/// Wire model for an item of `GET /api/inventory/low-stock`.
class LowStockItemDto {
  const LowStockItemDto({
    required this.variacaoId,
    required this.saldoAtual,
    required this.quantidadeReservada,
    required this.saldoDisponivel,
    required this.estoqueMinimo,
  });

  factory LowStockItemDto.fromJson(Map<String, dynamic> json) => LowStockItemDto(
    variacaoId: json['variacaoId'] as String,
    saldoAtual: (json['saldoAtual'] as num).toInt(),
    quantidadeReservada: (json['quantidadeReservada'] as num).toInt(),
    saldoDisponivel: (json['saldoDisponivel'] as num).toInt(),
    estoqueMinimo: (json['estoqueMinimo'] as num).toInt(),
  );

  final String variacaoId;
  final int saldoAtual;
  final int quantidadeReservada;
  final int saldoDisponivel;
  final int estoqueMinimo;

  LowStockItemEntity toEntity() => LowStockItemEntity(
    variacaoId: variacaoId,
    saldoAtual: saldoAtual,
    quantidadeReservada: quantidadeReservada,
    saldoDisponivel: saldoDisponivel,
    estoqueMinimo: estoqueMinimo,
  );
}
