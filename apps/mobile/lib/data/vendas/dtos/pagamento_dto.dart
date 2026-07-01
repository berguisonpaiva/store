import '../../../domain/vendas/entities/forma_pagamento.dart';
import '../../../domain/vendas/entities/pagamento_entity.dart';
import '../../caixa/dtos/cash_money.dart';

/// Wire model for a payment. `valor` arrives as reais (`number`) and is stored
/// as integer cents in the entity.
class PagamentoDto {
  const PagamentoDto({
    required this.id,
    required this.forma,
    required this.valor,
  });

  factory PagamentoDto.fromJson(Map<String, dynamic> json) => PagamentoDto(
    id: json['id'] as String,
    forma: json['forma'] as String,
    valor: (json['valor'] as num).toDouble(),
  );

  final String id;
  final String forma;

  /// Amount in reais (wire format).
  final double valor;

  Map<String, dynamic> toJson() => {'id': id, 'forma': forma, 'valor': valor};

  PagamentoEntity toEntity() => PagamentoEntity(
    id: id,
    forma: FormaPagamento.fromWire(forma),
    valorCents: CashMoney.reaisToCents(valor),
  );
}
