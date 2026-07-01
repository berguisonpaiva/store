import 'package:equatable/equatable.dart';

/// A variation whose current balance is at or below its minimum — a
/// replenishment alert.
class LowStockItemEntity extends Equatable {
  const LowStockItemEntity({
    required this.variacaoId,
    required this.saldoAtual,
    required this.quantidadeReservada,
    required this.saldoDisponivel,
    required this.estoqueMinimo,
  });

  final String variacaoId;
  final int saldoAtual;
  final int quantidadeReservada;
  final int saldoDisponivel;
  final int estoqueMinimo;

  @override
  List<Object?> get props => [
    variacaoId,
    saldoAtual,
    quantidadeReservada,
    saldoDisponivel,
    estoqueMinimo,
  ];
}
