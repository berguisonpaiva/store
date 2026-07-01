import 'package:equatable/equatable.dart';

/// Current stock position of a variation, as understood by the domain.
class StockBalanceEntity extends Equatable {
  const StockBalanceEntity({
    required this.variacaoId,
    required this.saldoAtual,
    required this.quantidadeReservada,
    required this.saldoDisponivel,
    required this.estoqueMinimo,
  });

  final String variacaoId;
  final int saldoAtual;
  final int quantidadeReservada;

  /// `saldoAtual - quantidadeReservada`.
  final int saldoDisponivel;
  final int estoqueMinimo;

  /// Whether the current balance is at or below the configured minimum.
  bool get isBelowMinimum => saldoAtual < estoqueMinimo;

  @override
  List<Object?> get props => [
    variacaoId,
    saldoAtual,
    quantidadeReservada,
    saldoDisponivel,
    estoqueMinimo,
  ];
}
