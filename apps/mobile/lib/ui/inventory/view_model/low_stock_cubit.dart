import 'package:bloc/bloc.dart';

import '../../../domain/inventory/usecases/list_low_stock_usecase.dart';
import 'low_stock_state.dart';

/// Drives the low-stock alerts screen. No Flutter imports.
class LowStockCubit extends Cubit<LowStockState> {
  LowStockCubit({required ListLowStockUseCase listLowStock})
    : _listLowStock = listLowStock,
      super(const LowStockState());

  final ListLowStockUseCase _listLowStock;

  Future<void> load() async {
    emit(const LowStockState(status: LowStockStatus.loading));
    final result = await _listLowStock();
    result.match(
      (failure) => emit(
        LowStockState(status: LowStockStatus.error, errorCode: failure.code),
      ),
      (items) => emit(
        LowStockState(status: LowStockStatus.loaded, items: items),
      ),
    );
  }
}
