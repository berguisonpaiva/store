import '../../../domain/vendas/entities/item_venda_entity.dart';
import '../../caixa/dtos/cash_money.dart';

/// Wire model for a sale line item. Monetary fields arrive as reais (`number`)
/// and are stored as integer cents in the entity. Conversion happens at this
/// boundary, mirroring how the `caixa` feature handles money.
class ItemVendaDto {
  const ItemVendaDto({
    required this.id,
    required this.variacaoId,
    required this.quantidade,
    required this.precoUnitario,
    required this.total,
  });

  factory ItemVendaDto.fromJson(Map<String, dynamic> json) => ItemVendaDto(
    id: json['id'] as String,
    variacaoId: json['variacaoId'] as String,
    quantidade: (json['quantidade'] as num).toInt(),
    precoUnitario: (json['precoUnitario'] as num).toDouble(),
    total: (json['total'] as num).toDouble(),
  );

  final String id;
  final String variacaoId;
  final int quantidade;

  /// Unit price, in reais (wire format).
  final double precoUnitario;

  /// Line total, in reais (wire format).
  final double total;

  Map<String, dynamic> toJson() => {
    'id': id,
    'variacaoId': variacaoId,
    'quantidade': quantidade,
    'precoUnitario': precoUnitario,
    'total': total,
  };

  ItemVendaEntity toEntity() => ItemVendaEntity(
    id: id,
    variacaoId: variacaoId,
    quantidade: quantidade,
    precoUnitarioCents: CashMoney.reaisToCents(precoUnitario),
    totalCents: CashMoney.reaisToCents(total),
  );
}
