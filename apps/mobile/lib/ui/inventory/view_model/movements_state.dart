import 'package:equatable/equatable.dart';

import '../../../domain/inventory/entities/stock_movements_page_entity.dart';

enum MovementsStatus { idle, loading, loaded, error }

class MovementsState extends Equatable {
  const MovementsState({
    this.status = MovementsStatus.idle,
    this.page,
    this.errorCode,
  });

  final MovementsStatus status;
  final StockMovementsPageEntity? page;
  final String? errorCode;

  bool get isLoading => status == MovementsStatus.loading;

  @override
  List<Object?> get props => [status, page, errorCode];
}
