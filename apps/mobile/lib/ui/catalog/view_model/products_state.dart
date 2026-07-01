import 'package:equatable/equatable.dart';

import '../../../domain/catalog/entities/category_entity.dart';
import '../../../domain/catalog/entities/product_summary_entity.dart';

enum ProductsStatus { idle, loading, loaded, error }

/// State for the products list: the current filters, the accumulated (paged)
/// items, and the available categories for the filter dropdown.
class ProductsState extends Equatable {
  const ProductsState({
    this.status = ProductsStatus.idle,
    this.items = const [],
    this.categories = const [],
    this.name = '',
    this.categoryId,
    this.active,
    this.page = 1,
    this.totalPages = 1,
    this.total = 0,
    this.isLoadingMore = false,
    this.errorCode,
  });

  final ProductsStatus status;
  final List<ProductSummaryEntity> items;
  final List<CategoryEntity> categories;
  final String name;
  final String? categoryId;
  final bool? active;
  final int page;
  final int totalPages;
  final int total;
  final bool isLoadingMore;
  final String? errorCode;

  bool get isLoading => status == ProductsStatus.loading;
  bool get hasMore => page < totalPages;

  ProductsState copyWith({
    ProductsStatus? status,
    List<ProductSummaryEntity>? items,
    List<CategoryEntity>? categories,
    String? name,
    String? categoryId,
    bool clearCategoryId = false,
    bool? active,
    bool clearActive = false,
    int? page,
    int? totalPages,
    int? total,
    bool? isLoadingMore,
    String? errorCode,
  }) {
    return ProductsState(
      status: status ?? this.status,
      items: items ?? this.items,
      categories: categories ?? this.categories,
      name: name ?? this.name,
      categoryId: clearCategoryId ? null : (categoryId ?? this.categoryId),
      active: clearActive ? null : (active ?? this.active),
      page: page ?? this.page,
      totalPages: totalPages ?? this.totalPages,
      total: total ?? this.total,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      errorCode: errorCode,
    );
  }

  @override
  List<Object?> get props => [
    status,
    items,
    categories,
    name,
    categoryId,
    active,
    page,
    totalPages,
    total,
    isLoadingMore,
    errorCode,
  ];
}
