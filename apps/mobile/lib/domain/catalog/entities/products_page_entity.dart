import 'package:equatable/equatable.dart';

import 'product_summary_entity.dart';

/// A page of products plus pagination metadata, as returned by the backend.
class ProductsPageEntity extends Equatable {
  const ProductsPageEntity({
    required this.items,
    required this.page,
    required this.pageSize,
    required this.total,
    required this.totalPages,
  });

  final List<ProductSummaryEntity> items;
  final int page;
  final int pageSize;
  final int total;
  final int totalPages;

  /// Whether another page can be loaded after this one.
  bool get hasMore => page < totalPages;

  @override
  List<Object?> get props => [items, page, pageSize, total, totalPages];
}
