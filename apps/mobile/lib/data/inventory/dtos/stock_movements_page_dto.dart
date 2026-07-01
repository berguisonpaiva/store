import '../../../domain/inventory/entities/stock_movements_page_entity.dart';
import 'stock_movement_dto.dart';

/// Wire model for the paginated movements response (`{ data, meta }`).
class StockMovementsPageDto {
  const StockMovementsPageDto({
    required this.items,
    required this.page,
    required this.pageSize,
    required this.total,
    required this.totalPages,
  });

  factory StockMovementsPageDto.fromJson(Map<String, dynamic> json) {
    final data = (json['data'] as List<dynamic>)
        .map((e) => StockMovementDto.fromJson(e as Map<String, dynamic>))
        .toList();
    final meta = json['meta'] as Map<String, dynamic>;
    return StockMovementsPageDto(
      items: data,
      page: (meta['page'] as num).toInt(),
      pageSize: (meta['pageSize'] as num).toInt(),
      total: (meta['total'] as num).toInt(),
      totalPages: (meta['totalPages'] as num).toInt(),
    );
  }

  final List<StockMovementDto> items;
  final int page;
  final int pageSize;
  final int total;
  final int totalPages;

  StockMovementsPageEntity toEntity() => StockMovementsPageEntity(
    items: items.map((e) => e.toEntity()).toList(),
    page: page,
    pageSize: pageSize,
    total: total,
    totalPages: totalPages,
  );
}
