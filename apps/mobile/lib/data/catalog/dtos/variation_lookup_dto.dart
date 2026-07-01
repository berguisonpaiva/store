import '../../../domain/catalog/entities/variation_lookup_entity.dart';
import 'variation_dto.dart';

/// Wire model for the SKU/barcode lookup endpoints
/// (`{ productId, productName, productActive, variation }`).
class VariationLookupDto {
  const VariationLookupDto({
    required this.productId,
    required this.productName,
    required this.productActive,
    required this.variation,
  });

  factory VariationLookupDto.fromJson(Map<String, dynamic> json) =>
      VariationLookupDto(
        productId: json['productId'] as String,
        productName: json['productName'] as String,
        productActive: json['productActive'] as bool,
        variation: VariationDto.fromJson(
          json['variation'] as Map<String, dynamic>,
        ),
      );

  final String productId;
  final String productName;
  final bool productActive;
  final VariationDto variation;

  VariationLookupEntity toEntity() => VariationLookupEntity(
    productId: productId,
    productName: productName,
    productActive: productActive,
    variation: variation.toEntity(),
  );
}
