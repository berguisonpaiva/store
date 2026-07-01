import 'package:equatable/equatable.dart';

import 'stock_movement_entity.dart';

/// A page of ledger movements plus pagination metadata.
class StockMovementsPageEntity extends Equatable {
  const StockMovementsPageEntity({
    required this.items,
    required this.page,
    required this.pageSize,
    required this.total,
    required this.totalPages,
  });

  final List<StockMovementEntity> items;
  final int page;
  final int pageSize;
  final int total;
  final int totalPages;

  bool get isEmpty => items.isEmpty;
  bool get hasMore => page < totalPages;

  @override
  List<Object?> get props => [items, page, pageSize, total, totalPages];
}
