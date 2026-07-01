import '../../../domain/vendas/entities/resumo_vendas_entity.dart';
import '../../caixa/dtos/cash_money.dart';

/// Wire model for `GET /vendas/resumo`. Monetary fields arrive as reais
/// (`number`) and are stored as integer cents in the entity.
class ResumoVendasDto {
  const ResumoVendasDto({
    required this.quantidade,
    required this.subtotal,
    required this.desconto,
    required this.total,
  });

  factory ResumoVendasDto.fromJson(Map<String, dynamic> json) =>
      ResumoVendasDto(
        quantidade: (json['quantidade'] as num).toInt(),
        subtotal: (json['subtotal'] as num).toDouble(),
        desconto: (json['desconto'] as num).toDouble(),
        total: (json['total'] as num).toDouble(),
      );

  final int quantidade;

  /// Σ subtotals in reais (wire format).
  final double subtotal;

  /// Σ discounts in reais (wire format).
  final double desconto;

  /// Σ totals in reais (wire format).
  final double total;

  ResumoVendasEntity toEntity() => ResumoVendasEntity(
    quantidade: quantidade,
    subtotalCents: CashMoney.reaisToCents(subtotal),
    descontoCents: CashMoney.reaisToCents(desconto),
    totalCents: CashMoney.reaisToCents(total),
  );
}
