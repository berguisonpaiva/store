import 'package:go_router/go_router.dart';

import '../../ui/auth/login_page.dart';
import '../../ui/auth/view_model/auth_session_cubit.dart';
import '../../ui/auth/view_model/auth_session_state.dart';
import '../../ui/caixa/abrir_caixa_page.dart';
import '../../ui/caixa/caixa_status_page.dart';
import '../../ui/caixa/fechar_caixa_page.dart';
import '../../ui/caixa/sessao_ativa_page.dart';
import '../../ui/catalog/product_detail_page.dart';
import '../../ui/catalog/products_page.dart';
import '../../ui/catalog/variation_lookup_page.dart';
import '../../ui/home/home_page.dart';
import '../../ui/inventory/balance_lookup_page.dart';
import '../../ui/inventory/inventory_menu_page.dart';
import '../../ui/inventory/low_stock_page.dart';
import '../../ui/inventory/movements_page.dart';
import '../../ui/inventory/stock_adjustment_page.dart';
import '../../ui/inventory/stock_entry_page.dart';
import '../../ui/inventory/stock_exit_page.dart';
import '../../ui/splash/splash_page.dart';
import '../../ui/vendas/venda_detail_page.dart';
import '../../ui/vendas/venda_pdv_page.dart';
import '../../ui/vendas/vendas_history_page.dart';
import 'go_router_refresh_stream.dart';

/// Builds the app router guarded by [AuthSessionCubit].
///
/// - `unknown` → `/splash` (while restoring the session)
/// - `unauthenticated` → `/login`
/// - `authenticated` on `/login` or `/splash` → `/`
GoRouter createAppRouter(AuthSessionCubit session) {
  return GoRouter(
    initialLocation: '/',
    refreshListenable: GoRouterRefreshStream(session.stream),
    redirect: (context, state) {
      final status = session.state.status;
      final location = state.matchedLocation;

      if (status == AuthStatus.unknown) {
        return location == '/splash' ? null : '/splash';
      }
      if (status == AuthStatus.unauthenticated) {
        return location == '/login' ? null : '/login';
      }
      if (location == '/login' || location == '/splash') {
        return '/';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (context, state) => const SplashPage()),
      GoRoute(path: '/login', builder: (context, state) => const LoginPage()),
      GoRoute(path: '/', builder: (context, state) => const HomePage()),
      GoRoute(
        path: '/catalog',
        builder: (context, state) => const ProductsPage(),
        routes: [
          GoRoute(
            path: 'lookup',
            builder: (context, state) => const VariationLookupPage(),
          ),
          GoRoute(
            path: 'products/:id',
            builder: (context, state) =>
                ProductDetailPage(productId: state.pathParameters['id']!),
          ),
        ],
      ),
      GoRoute(
        path: '/caixa',
        builder: (context, state) => const CaixaStatusPage(),
        routes: [
          GoRoute(
            path: 'abrir',
            builder: (context, state) => const AbrirCaixaPage(),
          ),
          GoRoute(
            path: 'sessao',
            builder: (context, state) =>
                SessaoAtivaPage(sessaoId: state.extra! as String),
          ),
          GoRoute(
            path: 'fechar',
            builder: (context, state) =>
                FecharCaixaPage(args: state.extra! as FecharCaixaArgs),
          ),
        ],
      ),
      GoRoute(
        path: '/vendas',
        builder: (context, state) =>
            VendaPdvPage(onOpenCash: () => context.go('/caixa')),
        routes: [
          GoRoute(
            path: 'historico',
            builder: (context, state) => VendasHistoryPage(
              onOpenVenda: (id) => context.push('/vendas/historico/$id'),
            ),
            routes: [
              GoRoute(
                path: ':id',
                builder: (context, state) =>
                    VendaDetailPage(vendaId: state.pathParameters['id']!),
              ),
            ],
          ),
        ],
      ),
      GoRoute(
        path: '/inventory',
        builder: (context, state) => const InventoryMenuPage(),
        routes: [
          GoRoute(
            path: 'balance',
            builder: (context, state) => const BalanceLookupPage(),
          ),
          GoRoute(
            path: 'movements',
            builder: (context, state) => const MovementsPage(),
          ),
          GoRoute(
            path: 'low-stock',
            builder: (context, state) => const LowStockPage(),
          ),
          GoRoute(
            path: 'entry',
            builder: (context, state) => const StockEntryPage(),
          ),
          GoRoute(
            path: 'exit',
            builder: (context, state) => const StockExitPage(),
          ),
          GoRoute(
            path: 'adjustment',
            builder: (context, state) => const StockAdjustmentPage(),
          ),
        ],
      ),
    ],
  );
}
