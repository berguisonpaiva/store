import 'package:equatable/equatable.dart';

import '../../../domain/inventory/entities/low_stock_item_entity.dart';

enum LowStockStatus { idle, loading, loaded, error }

class LowStockState extends Equatable {
  const LowStockState({
    this.status = LowStockStatus.idle,
    this.items = const [],
    this.errorCode,
  });

  final LowStockStatus status;
  final List<LowStockItemEntity> items;
  final String? errorCode;

  bool get isLoading => status == LowStockStatus.loading;

  @override
  List<Object?> get props => [status, items, errorCode];
}
