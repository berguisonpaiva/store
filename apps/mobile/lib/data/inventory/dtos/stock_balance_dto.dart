import '../../../domain/inventory/entities/stock_balance_entity.dart';

/// Wire model for `GET /api/inventory/variations/:variacaoId/balance`.
class StockBalanceDto {
  const StockBalanceDto({
    required this.variacaoId,
    required this.saldoAtual,
    required this.quantidadeReservada,
    required this.saldoDisponivel,
    required this.estoqueMinimo,
  });

  factory StockBalanceDto.fromJson(Map<String, dynamic> json) => StockBalanceDto(
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

  StockBalanceEntity toEntity() => StockBalanceEntity(
    variacaoId: variacaoId,
    saldoAtual: saldoAtual,
    quantidadeReservada: quantidadeReservada,
    saldoDisponivel: saldoDisponivel,
    estoqueMinimo: estoqueMinimo,
  );
}
