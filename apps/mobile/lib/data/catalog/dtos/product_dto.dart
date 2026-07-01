import '../../../domain/catalog/entities/product_entity.dart';
import 'variation_dto.dart';

/// Wire model for `GET /api/products/:id` (product with variations).
class ProductDto {
  const ProductDto({
    required this.id,
    required this.name,
    required this.description,
    required this.categoryId,
    required this.active,
    required this.variations,
  });

  factory ProductDto.fromJson(Map<String, dynamic> json) => ProductDto(
    id: json['id'] as String,
    name: json['name'] as String,
    description: json['description'] as String?,
    categoryId: json['categoryId'] as String?,
    active: json['active'] as bool,
    variations: (json['variations'] as List<dynamic>? ?? const [])
        .map((e) => VariationDto.fromJson(e as Map<String, dynamic>))
        .toList(),
  );

  final String id;
  final String name;
  final String? description;
  final String? categoryId;
  final bool active;
  final List<VariationDto> variations;

  ProductEntity toEntity() => ProductEntity(
    id: id,
    name: name,
    description: description,
    categoryId: categoryId,
    active: active,
    variations: variations.map((v) => v.toEntity()).toList(),
  );
}
