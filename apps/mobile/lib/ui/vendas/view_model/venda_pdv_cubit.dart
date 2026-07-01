import 'package:bloc/bloc.dart';
import 'package:fpdart/fpdart.dart';

import '../../../domain/vendas/entities/forma_pagamento.dart';
import '../../../domain/vendas/entities/tipo_desconto.dart';
import '../../../domain/vendas/entities/venda_entity.dart';
import '../../../domain/vendas/errors/vendas_failure.dart';
import '../../../domain/vendas/repositories/vendas_repository.dart';
import '../../../domain/vendas/usecases/adicionar_item_usecase.dart';
import '../../../domain/vendas/usecases/aplicar_desconto_usecase.dart';
import '../../../domain/vendas/usecases/cancelar_venda_usecase.dart';
import '../../../domain/vendas/usecases/criar_venda_usecase.dart';
import '../../../domain/vendas/usecases/finalizar_venda_usecase.dart';
import '../../../domain/vendas/usecases/remover_item_usecase.dart';
import 'venda_pdv_state.dart';

/// Drives the PDV sale screen: starts a sale, adds/removes items, applies a
/// discount, finalizes and cancels. No Flutter imports — visual state is
/// expressed as semantic enums in [VendaPdvState].
class VendaPdvCubit extends Cubit<VendaPdvState> {
  VendaPdvCubit({
    required CriarVendaUseCase criarVenda,
    required AdicionarItemUseCase adicionarItem,
    required RemoverItemUseCase removerItem,
    required AplicarDescontoUseCase aplicarDesconto,
    required FinalizarVendaUseCase finalizarVenda,
    required CancelarVendaUseCase cancelarVenda,
  }) : _criarVenda = criarVenda,
       _adicionarItem = adicionarItem,
       _removerItem = removerItem,
       _aplicarDesconto = aplicarDesconto,
       _finalizarVenda = finalizarVenda,
       _cancelarVenda = cancelarVenda,
       super(const VendaPdvState());

  final CriarVendaUseCase _criarVenda;
  final AdicionarItemUseCase _adicionarItem;
  final RemoverItemUseCase _removerItem;
  final AplicarDescontoUseCase _aplicarDesconto;
  final FinalizarVendaUseCase _finalizarVenda;
  final CancelarVendaUseCase _cancelarVenda;

  /// Opens a new sale. Surfaces [NoOpenCashSessionFailure] as a dedicated
  /// blocked state so the view can guide the operator to open the cash drawer.
  Future<void> start() async {
    emit(const VendaPdvState(status: VendaPdvStatus.loading));
    final result = await _criarVenda();
    result.match(
      (failure) => emit(
        VendaPdvState(
          status: failure is NoOpenCashSessionFailure
              ? VendaPdvStatus.noOpenCashSession
              : VendaPdvStatus.error,
          errorCode: failure.code,
        ),
      ),
      (venda) => emit(
        VendaPdvState(status: VendaPdvStatus.loaded, venda: venda),
      ),
    );
  }

  Future<void> bip({
    required String code,
    int quantidade = 1,
    bool isSku = false,
  }) async {
    final vendaId = state.venda?.id;
    if (vendaId == null || code.trim().isEmpty) return;
    emit(state.copyWith(opStatus: VendaOpStatus.submitting));
    final result = await _adicionarItem(
      vendaId: vendaId,
      params: AdicionarItemParams(
        quantidade: quantidade,
        sku: isSku ? code.trim() : null,
        codigoBarras: isSku ? null : code.trim(),
      ),
    );
    _applyOp(result);
  }

  Future<void> removerItem(String itemId) async {
    final vendaId = state.venda?.id;
    if (vendaId == null) return;
    emit(state.copyWith(opStatus: VendaOpStatus.submitting));
    final result = await _removerItem(vendaId: vendaId, itemId: itemId);
    _applyOp(result);
  }

  Future<void> aplicarDesconto({
    required TipoDesconto tipo,
    required num valor,
  }) async {
    final vendaId = state.venda?.id;
    if (vendaId == null) return;
    emit(state.copyWith(opStatus: VendaOpStatus.submitting));
    final result = await _aplicarDesconto(
      vendaId: vendaId,
      tipo: tipo,
      valor: valor,
      subtotalCents: state.subtotalCents,
    );
    _applyOp(result);
  }

  Future<void> finalizar(List<PagamentoInput> pagamentos) async {
    final vendaId = state.venda?.id;
    if (vendaId == null) return;
    emit(state.copyWith(opStatus: VendaOpStatus.submitting));
    final result = await _finalizarVenda(
      vendaId: vendaId,
      pagamentos: pagamentos,
    );
    _applyOp(result);
  }

  Future<void> cancelar() async {
    final vendaId = state.venda?.id;
    if (vendaId == null) return;
    emit(state.copyWith(opStatus: VendaOpStatus.submitting));
    final result = await _cancelarVenda(vendaId);
    _applyOp(result);
  }

  void _applyOp(Either<VendasFailure, VendaEntity> result) {
    result.match(
      (failure) => emit(
        state.copyWith(
          opStatus: VendaOpStatus.failure,
          opErrorCode: failure.code,
        ),
      ),
      (venda) => emit(
        state.copyWith(
          status: VendaPdvStatus.loaded,
          venda: venda,
          opStatus: VendaOpStatus.success,
        ),
      ),
    );
  }

  /// Sum of a candidate payment list, in cents — used by the finalize step to
  /// know when payments cover the total. Pure helper, no state mutation.
  static int sumPayments(Iterable<PagamentoInput> pagamentos) =>
      pagamentos.fold(0, (acc, p) => acc + p.valorCents);

  /// Convenience for the finalize view: a single full-cash payment for [total].
  static List<PagamentoInput> singleCash(int totalCents) => [
    PagamentoInput(forma: FormaPagamento.dinheiro, valorCents: totalCents),
  ];
}
