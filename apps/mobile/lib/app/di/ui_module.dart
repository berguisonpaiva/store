import 'package:get_it/get_it.dart';

import '../../core/network/http_client.dart';
import '../../domain/auth/usecases/restore_session_usecase.dart';
import '../../domain/auth/usecases/sign_in_usecase.dart';
import '../../domain/auth/usecases/sign_out_usecase.dart';
import '../../domain/caixa/usecases/abrir_caixa_usecase.dart';
import '../../domain/caixa/usecases/listar_movimentacoes_usecase.dart';
import '../../domain/caixa/usecases/obter_caixa_aberto_usecase.dart';
import '../../domain/caixa/usecases/obter_resumo_sessao_usecase.dart';
import '../../domain/caixa/usecases/registrar_sangria_usecase.dart';
import '../../domain/caixa/usecases/registrar_suprimento_usecase.dart';
import '../../domain/catalog/usecases/find_variation_by_barcode_usecase.dart';
import '../../domain/catalog/usecases/find_variation_by_sku_usecase.dart';
import '../../domain/catalog/usecases/get_product_usecase.dart';
import '../../domain/catalog/usecases/list_categories_usecase.dart';
import '../../domain/catalog/usecases/list_products_usecase.dart';
import '../../domain/inventory/usecases/adjust_balance_usecase.dart';
import '../../domain/inventory/usecases/get_balance_usecase.dart';
import '../../domain/inventory/usecases/list_low_stock_usecase.dart';
import '../../domain/inventory/usecases/list_movements_usecase.dart';
import '../../domain/inventory/usecases/register_entry_usecase.dart';
import '../../domain/inventory/usecases/register_exit_usecase.dart';
import '../../domain/vendas/usecases/adicionar_item_usecase.dart';
import '../../domain/vendas/usecases/aplicar_desconto_usecase.dart';
import '../../domain/vendas/usecases/cancelar_venda_usecase.dart';
import '../../domain/vendas/usecases/criar_venda_usecase.dart';
import '../../domain/vendas/usecases/finalizar_venda_usecase.dart';
import '../../domain/vendas/usecases/remover_item_usecase.dart';
import '../../ui/auth/view_model/auth_session_cubit.dart';
import '../../ui/auth/view_model/login_cubit.dart';
import '../../ui/caixa/view_model/abrir_caixa_cubit.dart';
import '../../ui/caixa/view_model/caixa_status_cubit.dart';
import '../../ui/caixa/view_model/sessao_ativa_cubit.dart';
import '../../ui/home/view_model/home_cubit.dart';
import '../../ui/inventory/view_model/balance_lookup_cubit.dart';
import '../../ui/inventory/view_model/low_stock_cubit.dart';
import '../../ui/vendas/view_model/venda_pdv_cubit.dart';
import '../../ui/catalog/view_model/product_detail_cubit.dart';
import '../../ui/catalog/view_model/products_cubit.dart';
import '../../ui/catalog/view_model/variation_lookup_cubit.dart';
import '../../ui/inventory/view_model/movements_cubit.dart';
import '../../ui/inventory/view_model/stock_movement_cubit.dart';

/// Registers ViewModels/Cubits. The app-level [AuthSessionCubit] is a singleton
/// (drives the router); feature cubits are factories.
void registerUiModule(GetIt gi) {
  gi.registerFactory(HomeCubit.new);

  gi.registerLazySingleton<AuthSessionCubit>(
    () => AuthSessionCubit(
      restoreSession: gi<RestoreSessionUseCase>(),
      signOut: gi<SignOutUseCase>(),
      httpClient: gi<HttpClient>(),
    ),
  );

  gi.registerFactory(
    () => LoginCubit(
      signIn: gi<SignInUseCase>(),
      authSession: gi<AuthSessionCubit>(),
    ),
  );

  gi.registerFactory(
    () => BalanceLookupCubit(getBalance: gi<GetBalanceUseCase>()),
  );
  gi.registerFactory(
    () => MovementsCubit(listMovements: gi<ListMovementsUseCase>()),
  );
  gi.registerFactory(
    () => LowStockCubit(listLowStock: gi<ListLowStockUseCase>()),
  );
  gi.registerFactory(
    () => StockMovementCubit(
      registerEntry: gi<RegisterEntryUseCase>(),
      registerExit: gi<RegisterExitUseCase>(),
      adjustBalance: gi<AdjustBalanceUseCase>(),
    ),
  );

  gi.registerFactory(
    () => CaixaStatusCubit(obterCaixaAberto: gi<ObterCaixaAbertoUseCase>()),
  );
  gi.registerFactory(
    () => AbrirCaixaCubit(abrirCaixa: gi<AbrirCaixaUseCase>()),
  );
  gi.registerFactory(
    () => SessaoAtivaCubit(
      obterResumo: gi<ObterResumoSessaoUseCase>(),
      listarMovimentacoes: gi<ListarMovimentacoesUseCase>(),
      registrarSangria: gi<RegistrarSangriaUseCase>(),
      registrarSuprimento: gi<RegistrarSuprimentoUseCase>(),
    ),
  );

  gi.registerFactory(
    () => VendaPdvCubit(
      criarVenda: gi<CriarVendaUseCase>(),
      adicionarItem: gi<AdicionarItemUseCase>(),
      removerItem: gi<RemoverItemUseCase>(),
      aplicarDesconto: gi<AplicarDescontoUseCase>(),
      finalizarVenda: gi<FinalizarVendaUseCase>(),
      cancelarVenda: gi<CancelarVendaUseCase>(),
    ),
  );

  gi.registerFactory(
    () => ProductsCubit(
      listProducts: gi<ListProductsUseCase>(),
      listCategories: gi<ListCategoriesUseCase>(),
    ),
  );
  gi.registerFactory(
    () => ProductDetailCubit(getProduct: gi<GetProductUseCase>()),
  );
  gi.registerFactory(
    () => VariationLookupCubit(
      findBySku: gi<FindVariationBySkuUseCase>(),
      findByBarcode: gi<FindVariationByBarcodeUseCase>(),
    ),
  );
}
