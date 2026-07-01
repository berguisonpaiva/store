import '../../../domain/catalog/entities/product_summary_entity.dart';

/// Wire model for a product row in `GET /api/products` (no variation detail).
class ProductSummaryDto {
  const ProductSummaryDto({
    required this.id,
    required this.name,
    required this.categoryId,
    required this.active,
    required this.variationCount,
  });

  factory ProductSummaryDto.fromJson(Map<String, dynamic> json) =>
      ProductSummaryDto(
        id: json['id'] as String,
        name: json['name'] as String,
        categoryId: json['categoryId'] as String?,
        active: json['active'] as bool,
        variationCount: (json['variationCount'] as num).toInt(),
      );

  final String id;
  final String name;
  final String? categoryId;
  final bool active;
  final int variationCount;

  ProductSummaryEntity toEntity() => ProductSummaryEntity(
    id: id,
    name: name,
    categoryId: categoryId,
    active: active,
    variationCount: variationCount,
  );
}
