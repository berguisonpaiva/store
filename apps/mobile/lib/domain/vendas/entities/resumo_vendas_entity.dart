import 'package:equatable/equatable.dart';

/// Aggregated totals over a set of sales (`GET /vendas/resumo`).
///
/// All monetary fields are integer amounts in cents.
class ResumoVendasEntity extends Equatable {
  const ResumoVendasEntity({
    required this.quantidade,
    required this.subtotalCents,
    required this.descontoCents,
    required this.totalCents,
  });

  /// Number of sales matched by the filter.
  final int quantidade;
  final int subtotalCents;
  final int descontoCents;
  final int totalCents;

  @override
  List<Object?> get props => [
    quantidade,
    subtotalCents,
    descontoCents,
    totalCents,
  ];
}
