import 'package:equatable/equatable.dart';

/// A single line item in a sale.
///
/// Monetary fields ([precoUnitarioCents], [totalCents]) are integer amounts in
/// cents — the `/vendas` API speaks cents directly, so no conversion happens at
/// the boundary. Formatting to a currency string happens only in the UI layer.
class ItemVendaEntity extends Equatable {
  const ItemVendaEntity({
    required this.id,
    required this.variacaoId,
    required this.quantidade,
    required this.precoUnitarioCents,
    required this.totalCents,
  });

  final String id;
  final String variacaoId;
  final int quantidade;

  /// Unit price snapshot, in cents.
  final int precoUnitarioCents;

  /// Line total (`precoUnitario * quantidade`), in cents.
  final int totalCents;

  @override
  List<Object?> get props => [
    id,
    variacaoId,
    quantidade,
    precoUnitarioCents,
    totalCents,
  ];
}
