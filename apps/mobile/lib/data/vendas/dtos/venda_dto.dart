import '../../../domain/vendas/entities/canal_venda.dart';
import '../../../domain/vendas/entities/status_venda.dart';
import '../../../domain/vendas/entities/venda_entity.dart';
import '../../caixa/dtos/cash_money.dart';
import 'item_venda_dto.dart';
import 'pagamento_dto.dart';

/// Wire model for a sale. Monetary fields arrive as reais (`number`) and are
/// stored as integer cents in the entity. Conversion happens at this boundary,
/// mirroring how the `caixa` feature handles money.
class VendaDto {
  const VendaDto({
    required this.id,
    required this.canal,
    required this.status,
    required this.usuarioId,
    required this.sessaoCaixaId,
    required this.subtotal,
    required this.desconto,
    required this.total,
    required this.itens,
    required this.pagamentos,
    this.numero,
  });

  factory VendaDto.fromJson(Map<String, dynamic> json) => VendaDto(
    id: json['id'] as String,
    numero: (json['numero'] as num?)?.toInt(),
    canal: json['canal'] as String,
    status: json['status'] as String,
    usuarioId: json['usuarioId'] as String,
    sessaoCaixaId: json['sessaoCaixaId'] as String,
    subtotal: (json['subtotal'] as num).toDouble(),
    desconto: (json['desconto'] as num).toDouble(),
    total: (json['total'] as num).toDouble(),
    itens: ((json['itens'] as List<dynamic>?) ?? const [])
        .map((e) => ItemVendaDto.fromJson(e as Map<String, dynamic>))
        .toList(),
    pagamentos: ((json['pagamentos'] as List<dynamic>?) ?? const [])
        .map((e) => PagamentoDto.fromJson(e as Map<String, dynamic>))
        .toList(),
  );

  final String id;
  final int? numero;
  final String canal;
  final String status;
  final String usuarioId;
  final String sessaoCaixaId;

  /// Subtotal in reais (wire format).
  final double subtotal;

  /// Discount amount in reais (wire format).
  final double desconto;

  /// Total in reais (wire format).
  final double total;
  final List<ItemVendaDto> itens;
  final List<PagamentoDto> pagamentos;

  Map<String, dynamic> toJson() => {
    'id': id,
    'numero': numero,
    'canal': canal,
    'status': status,
    'usuarioId': usuarioId,
    'sessaoCaixaId': sessaoCaixaId,
    'subtotal': subtotal,
    'desconto': desconto,
    'total': total,
    'itens': itens.map((e) => e.toJson()).toList(),
    'pagamentos': pagamentos.map((e) => e.toJson()).toList(),
  };

  VendaEntity toEntity() => VendaEntity(
    id: id,
    numero: numero,
    canal: CanalVenda.fromWire(canal),
    status: StatusVenda.fromWire(status),
    usuarioId: usuarioId,
    sessaoCaixaId: sessaoCaixaId,
    subtotalCents: CashMoney.reaisToCents(subtotal),
    descontoCents: CashMoney.reaisToCents(desconto),
    totalCents: CashMoney.reaisToCents(total),
    itens: itens.map((e) => e.toEntity()).toList(),
    pagamentos: pagamentos.map((e) => e.toEntity()).toList(),
  );
}
