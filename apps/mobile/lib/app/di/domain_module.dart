import 'package:get_it/get_it.dart';

import '../../domain/auth/repositories/auth_repository.dart';
import '../../domain/auth/usecases/get_profile_usecase.dart';
import '../../domain/auth/usecases/refresh_session_usecase.dart';
import '../../domain/auth/usecases/restore_session_usecase.dart';
import '../../domain/auth/usecases/sign_in_usecase.dart';
import '../../domain/auth/usecases/sign_out_usecase.dart';
import '../../domain/caixa/repositories/caixa_repository.dart';
import '../../domain/caixa/usecases/abrir_caixa_usecase.dart';
import '../../domain/caixa/usecases/fechar_caixa_usecase.dart';
import '../../domain/caixa/usecases/listar_movimentacoes_usecase.dart';
import '../../domain/caixa/usecases/listar_sessoes_usecase.dart';
import '../../domain/caixa/usecases/obter_caixa_aberto_usecase.dart';
import '../../domain/caixa/usecases/obter_resumo_sessao_usecase.dart';
import '../../domain/caixa/usecases/obter_sessao_usecase.dart';
import '../../domain/caixa/usecases/registrar_sangria_usecase.dart';
import '../../domain/caixa/usecases/registrar_suprimento_usecase.dart';
import '../../domain/catalog/repositories/catalog_repository.dart';
import '../../domain/catalog/usecases/find_variation_by_barcode_usecase.dart';
import '../../domain/catalog/usecases/find_variation_by_sku_usecase.dart';
import '../../domain/catalog/usecases/get_product_usecase.dart';
import '../../domain/catalog/usecases/list_categories_usecase.dart';
import '../../domain/catalog/usecases/list_products_usecase.dart';
import '../../domain/inventory/repositories/inventory_repository.dart';
import '../../domain/inventory/usecases/adjust_balance_usecase.dart';
import '../../domain/inventory/usecases/get_balance_usecase.dart';
import '../../domain/inventory/usecases/list_low_stock_usecase.dart';
import '../../domain/inventory/usecases/list_movements_usecase.dart';
import '../../domain/inventory/usecases/register_entry_usecase.dart';
import '../../domain/inventory/usecases/register_exit_usecase.dart';
import '../../domain/vendas/repositories/vendas_repository.dart';
import '../../domain/vendas/usecases/adicionar_item_usecase.dart';
import '../../domain/vendas/usecases/aplicar_desconto_usecase.dart';
import '../../domain/vendas/usecases/buscar_venda_usecase.dart';
import '../../domain/vendas/usecases/cancelar_venda_usecase.dart';
import '../../domain/vendas/usecases/criar_venda_usecase.dart';
import '../../domain/vendas/usecases/finalizar_venda_usecase.dart';
import '../../domain/vendas/usecases/listar_vendas_usecase.dart';
import '../../domain/vendas/usecases/remover_item_usecase.dart';
import '../../domain/vendas/usecases/resumo_vendas_usecase.dart';

/// Registers use cases (stateless — factories).
void registerDomainModule(GetIt gi) {
  gi.registerFactory(() => SignInUseCase(gi<AuthRepository>()));
  gi.registerFactory(() => GetProfileUseCase(gi<AuthRepository>()));
  gi.registerFactory(() => SignOutUseCase(gi<AuthRepository>()));
  gi.registerFactory(() => RestoreSessionUseCase(gi<AuthRepository>()));
  gi.registerFactory(() => RefreshSessionUseCase(gi<AuthRepository>()));

  gi.registerFactory(() => GetBalanceUseCase(gi<InventoryRepository>()));
  gi.registerFactory(() => ListMovementsUseCase(gi<InventoryRepository>()));
  gi.registerFactory(() => ListLowStockUseCase(gi<InventoryRepository>()));
  gi.registerFactory(() => RegisterEntryUseCase(gi<InventoryRepository>()));
  gi.registerFactory(() => RegisterExitUseCase(gi<InventoryRepository>()));
  gi.registerFactory(() => AdjustBalanceUseCase(gi<InventoryRepository>()));

  gi.registerFactory(() => AbrirCaixaUseCase(gi<CaixaRepository>()));
  gi.registerFactory(() => FecharCaixaUseCase(gi<CaixaRepository>()));
  gi.registerFactory(() => RegistrarSangriaUseCase(gi<CaixaRepository>()));
  gi.registerFactory(() => RegistrarSuprimentoUseCase(gi<CaixaRepository>()));
  gi.registerFactory(() => ObterCaixaAbertoUseCase(gi<CaixaRepository>()));
  gi.registerFactory(() => ObterResumoSessaoUseCase(gi<CaixaRepository>()));
  gi.registerFactory(() => ListarMovimentacoesUseCase(gi<CaixaRepository>()));
  gi.registerFactory(() => ListarSessoesUseCase(gi<CaixaRepository>()));
  gi.registerFactory(() => ObterSessaoUseCase(gi<CaixaRepository>()));

  gi.registerFactory(() => CriarVendaUseCase(gi<VendasRepository>()));
  gi.registerFactory(() => AdicionarItemUseCase(gi<VendasRepository>()));
  gi.registerFactory(() => RemoverItemUseCase(gi<VendasRepository>()));
  gi.registerFactory(() => AplicarDescontoUseCase(gi<VendasRepository>()));
  gi.registerFactory(() => FinalizarVendaUseCase(gi<VendasRepository>()));
  gi.registerFactory(() => CancelarVendaUseCase(gi<VendasRepository>()));
  gi.registerFactory(() => BuscarVendaUseCase(gi<VendasRepository>()));
  gi.registerFactory(() => ListarVendasUseCase(gi<VendasRepository>()));
  gi.registerFactory(() => ResumoVendasUseCase(gi<VendasRepository>()));

  gi.registerFactory(() => ListProductsUseCase(gi<CatalogRepository>()));
  gi.registerFactory(() => GetProductUseCase(gi<CatalogRepository>()));
  gi.registerFactory(() => FindVariationBySkuUseCase(gi<CatalogRepository>()));
  gi.registerFactory(
    () => FindVariationByBarcodeUseCase(gi<CatalogRepository>()),
  );
  gi.registerFactory(() => ListCategoriesUseCase(gi<CatalogRepository>()));
}
