import 'package:equatable/equatable.dart';

/// A product variation (the unit that carries SKU, barcode, and price).
///
/// [priceCents] is an integer amount in cents; formatting to a currency string
/// happens only in the UI layer.
class VariationEntity extends Equatable {
  const VariationEntity({
    required this.id,
    required this.sku,
    required this.barcode,
    required this.attributes,
    required this.priceCents,
    required this.minStock,
    required this.active,
  });

  final String id;
  final String sku;
  final String? barcode;
  final Map<String, String> attributes;
  final int priceCents;
  final int minStock;
  final bool active;

  @override
  List<Object?> get props => [
    id,
    sku,
    barcode,
    attributes,
    priceCents,
    minStock,
    active,
  ];
}
