import '../../../domain/catalog/entities/products_page_entity.dart';
import 'product_summary_dto.dart';

/// Wire model for the paginated `GET /api/products` response
/// (`{ data: [...], meta: { page, pageSize, total, totalPages } }`).
class ProductsPageDto {
  const ProductsPageDto({
    required this.data,
    required this.page,
    required this.pageSize,
    required this.total,
    required this.totalPages,
  });

  factory ProductsPageDto.fromJson(Map<String, dynamic> json) {
    final meta = json['meta'] as Map<String, dynamic>;
    return ProductsPageDto(
      data: (json['data'] as List<dynamic>)
          .map((e) => ProductSummaryDto.fromJson(e as Map<String, dynamic>))
          .toList(),
      page: (meta['page'] as num).toInt(),
      pageSize: (meta['pageSize'] as num).toInt(),
      total: (meta['total'] as num).toInt(),
      totalPages: (meta['totalPages'] as num).toInt(),
    );
  }

  final List<ProductSummaryDto> data;
  final int page;
  final int pageSize;
  final int total;
  final int totalPages;

  ProductsPageEntity toEntity() => ProductsPageEntity(
    items: data.map((e) => e.toEntity()).toList(),
    page: page,
    pageSize: pageSize,
    total: total,
    totalPages: totalPages,
  );
}
