import 'package:equatable/equatable.dart';

import 'variation_entity.dart';

/// A catalog product with its full list of variations (detail view).
class ProductEntity extends Equatable {
  const ProductEntity({
    required this.id,
    required this.name,
    required this.description,
    required this.categoryId,
    required this.active,
    required this.variations,
  });

  final String id;
  final String name;
  final String? description;
  final String? categoryId;
  final bool active;
  final List<VariationEntity> variations;

  @override
  List<Object?> get props => [
    id,
    name,
    description,
    categoryId,
    active,
    variations,
  ];
}
