import '../../../domain/catalog/entities/variation_entity.dart';

/// Wire model for a product variation. `price` is integer cents.
class VariationDto {
  const VariationDto({
    required this.id,
    required this.sku,
    required this.barcode,
    required this.attributes,
    required this.price,
    required this.minStock,
    required this.active,
  });

  factory VariationDto.fromJson(Map<String, dynamic> json) => VariationDto(
    id: json['id'] as String,
    sku: json['sku'] as String,
    barcode: json['barcode'] as String?,
    attributes: (json['attributes'] as Map<String, dynamic>? ?? const {})
        .map((key, value) => MapEntry(key, value as String)),
    price: (json['price'] as num).toInt(),
    minStock: (json['minStock'] as num).toInt(),
    active: json['active'] as bool,
  );

  final String id;
  final String sku;
  final String? barcode;
  final Map<String, String> attributes;
  final int price;
  final int minStock;
  final bool active;

  VariationEntity toEntity() => VariationEntity(
    id: id,
    sku: sku,
    barcode: barcode,
    attributes: attributes,
    priceCents: price,
    minStock: minStock,
    active: active,
  );
}
