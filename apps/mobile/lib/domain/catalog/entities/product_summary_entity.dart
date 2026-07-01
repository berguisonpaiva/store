import 'package:equatable/equatable.dart';

/// Lightweight product row for the paginated list (no variation detail).
class ProductSummaryEntity extends Equatable {
  const ProductSummaryEntity({
    required this.id,
    required this.name,
    required this.categoryId,
    required this.active,
    required this.variationCount,
  });

  final String id;
  final String name;
  final String? categoryId;
  final bool active;
  final int variationCount;

  @override
  List<Object?> get props => [id, name, categoryId, active, variationCount];
}
