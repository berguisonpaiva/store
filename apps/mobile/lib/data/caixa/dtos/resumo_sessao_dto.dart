import '../../../domain/caixa/entities/resumo_sessao_entity.dart';
import 'cash_money.dart';

/// Wire model for `GET /caixa/:id/resumo`. All monetary fields arrive as reais.
class ResumoSessaoDto {
  const ResumoSessaoDto({
    required this.abertura,
    required this.suprimentos,
    required this.vendasDinheiro,
    required this.sangrias,
    required this.esperado,
    this.contado,
    this.divergencia,
  });

  factory ResumoSessaoDto.fromJson(Map<String, dynamic> json) => ResumoSessaoDto(
    abertura: (json['abertura'] as num).toDouble(),
    suprimentos: (json['suprimentos'] as num).toDouble(),
    vendasDinheiro: (json['vendasDinheiro'] as num).toDouble(),
    sangrias: (json['sangrias'] as num).toDouble(),
    esperado: (json['esperado'] as num).toDouble(),
    contado: (json['contado'] as num?)?.toDouble(),
    divergencia: (json['divergencia'] as num?)?.toDouble(),
  );

  final double abertura;
  final double suprimentos;
  final double vendasDinheiro;
  final double sangrias;
  final double esperado;
  final double? contado;
  final double? divergencia;

  ResumoSessaoEntity toEntity() => ResumoSessaoEntity(
    aberturaCents: CashMoney.reaisToCents(abertura),
    suprimentosCents: CashMoney.reaisToCents(suprimentos),
    vendasDinheiroCents: CashMoney.reaisToCents(vendasDinheiro),
    sangriasCents: CashMoney.reaisToCents(sangrias),
    esperadoCents: CashMoney.reaisToCents(esperado),
    contadoCents: contado == null ? null : CashMoney.reaisToCents(contado!),
    divergenciaCents: divergencia == null
        ? null
        : CashMoney.reaisToCents(divergencia!),
  );
}
