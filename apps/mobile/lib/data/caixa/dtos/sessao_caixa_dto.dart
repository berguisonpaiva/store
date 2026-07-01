import '../../../domain/caixa/entities/cash_session_status.dart';
import '../../../domain/caixa/entities/sessao_caixa_entity.dart';
import 'cash_money.dart';

/// Wire model for a cash session. Monetary fields arrive as reais (`number`)
/// and are stored as integer cents in the entity.
class SessaoCaixaDto {
  const SessaoCaixaDto({
    required this.id,
    required this.status,
    required this.valorAbertura,
    required this.abertaEm,
    this.operadorId,
    this.valorFechamento,
    this.fechadaEm,
  });

  factory SessaoCaixaDto.fromJson(Map<String, dynamic> json) => SessaoCaixaDto(
    id: json['id'] as String,
    status: json['status'] as String,
    valorAbertura: (json['valorAbertura'] as num).toDouble(),
    abertaEm: json['abertaEm'] as String,
    operadorId: json['operadorId'] as String?,
    valorFechamento: (json['valorFechamento'] as num?)?.toDouble(),
    fechadaEm: json['fechadaEm'] as String?,
  );

  final String id;
  final String status;
  final double valorAbertura;
  final String abertaEm;
  final String? operadorId;
  final double? valorFechamento;
  final String? fechadaEm;

  SessaoCaixaEntity toEntity() => SessaoCaixaEntity(
    id: id,
    status: CashSessionStatus.fromWire(status),
    valorAberturaCents: CashMoney.reaisToCents(valorAbertura),
    abertaEm: DateTime.parse(abertaEm).toLocal(),
    operadorId: operadorId,
    valorFechamentoCents: valorFechamento == null
        ? null
        : CashMoney.reaisToCents(valorFechamento!),
    fechadaEm: fechadaEm == null ? null : DateTime.parse(fechadaEm!).toLocal(),
  );
}
