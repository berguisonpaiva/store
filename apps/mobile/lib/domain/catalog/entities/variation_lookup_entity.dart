import 'package:equatable/equatable.dart';

import 'variation_entity.dart';

/// Result of resolving a variation by SKU or barcode (the PDV bipe): the
/// matched variation plus a snapshot of its owning product.
class VariationLookupEntity extends Equatable {
  const VariationLookupEntity({
    required this.productId,
    required this.productName,
    required this.productActive,
    required this.variation,
  });

  final String productId;
  final String productName;
  final bool productActive;
  final VariationEntity variation;

  @override
  List<Object?> get props => [
    productId,
    productName,
    productActive,
    variation,
  ];
}
