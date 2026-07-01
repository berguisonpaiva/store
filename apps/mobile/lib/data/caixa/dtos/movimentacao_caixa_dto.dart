import '../../../domain/caixa/entities/cash_movement_type.dart';
import '../../../domain/caixa/entities/movimentacao_caixa_entity.dart';
import 'cash_money.dart';

/// Wire model for a single cash-session movement. `valor` arrives as reais.
class MovimentacaoCaixaDto {
  const MovimentacaoCaixaDto({
    required this.id,
    required this.tipo,
    required this.valor,
    required this.criadaEm,
    this.observacao,
  });

  factory MovimentacaoCaixaDto.fromJson(Map<String, dynamic> json) =>
      MovimentacaoCaixaDto(
        id: json['id'] as String,
        tipo: json['tipo'] as String,
        valor: (json['valor'] as num).toDouble(),
        criadaEm: json['criadaEm'] as String,
        observacao: json['observacao'] as String?,
      );

  final String id;
  final String tipo;
  final double valor;
  final String criadaEm;
  final String? observacao;

  MovimentacaoCaixaEntity toEntity() => MovimentacaoCaixaEntity(
    id: id,
    tipo: CashMovementType.fromWire(tipo),
    valorCents: CashMoney.reaisToCents(valor),
    criadaEm: DateTime.parse(criadaEm).toLocal(),
    observacao: observacao,
  );
}
