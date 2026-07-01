import 'package:bloc/bloc.dart';

import '../../../domain/vendas/usecases/buscar_venda_usecase.dart';
import 'venda_detail_state.dart';

/// Loads a single sale by id for the read-only history detail. The backend
/// denies cross-operator reads (RN03 → `ACESSO_NEGADO`), surfaced as an error.
/// No Flutter imports.
class VendaDetailCubit extends Cubit<VendaDetailState> {
  VendaDetailCubit({required BuscarVendaUseCase buscarVenda})
    : _buscarVenda = buscarVenda,
      super(const VendaDetailState());

  final BuscarVendaUseCase _buscarVenda;

  Future<void> load(String vendaId) async {
    emit(const VendaDetailState(status: VendaDetailStatus.loading));
    final result = await _buscarVenda(vendaId);
    result.match(
      (failure) => emit(
        VendaDetailState(
          status: VendaDetailStatus.error,
          errorCode: failure.code,
        ),
      ),
      (venda) => emit(
        VendaDetailState(status: VendaDetailStatus.loaded, venda: venda),
      ),
    );
  }
}
