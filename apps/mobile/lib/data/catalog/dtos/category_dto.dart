import '../../../domain/catalog/entities/category_entity.dart';

/// Wire model for `GET /api/categories`.
class CategoryDto {
  const CategoryDto({
    required this.id,
    required this.name,
    required this.active,
  });

  factory CategoryDto.fromJson(Map<String, dynamic> json) => CategoryDto(
    id: json['id'] as String,
    name: json['name'] as String,
    active: json['active'] as bool,
  );

  final String id;
  final String name;
  final bool active;

  CategoryEntity toEntity() =>
      CategoryEntity(id: id, name: name, active: active);
}
