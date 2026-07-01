import 'package:equatable/equatable.dart';

/// Aggregated totals for a cash session (`GET /caixa/:id/resumo`).
///
/// All monetary fields are integer amounts in cents. [contadoCents] and
/// [divergenciaCents] are only present after the session is closed.
class ResumoSessaoEntity extends Equatable {
  const ResumoSessaoEntity({
    required this.aberturaCents,
    required this.suprimentosCents,
    required this.vendasDinheiroCents,
    required this.sangriasCents,
    required this.esperadoCents,
    this.contadoCents,
    this.divergenciaCents,
  });

  final int aberturaCents;
  final int suprimentosCents;
  final int vendasDinheiroCents;
  final int sangriasCents;

  /// Expected amount in the drawer:
  /// `abertura + suprimentos + vendasDinheiro - sangrias`.
  final int esperadoCents;

  /// Counted amount at closing (null while open).
  final int? contadoCents;

  /// `contado - esperado` (null while open). Positive = surplus, negative =
  /// shortage.
  final int? divergenciaCents;

  @override
  List<Object?> get props => [
    aberturaCents,
    suprimentosCents,
    vendasDinheiroCents,
    sangriasCents,
    esperadoCents,
    contadoCents,
    divergenciaCents,
  ];
}
