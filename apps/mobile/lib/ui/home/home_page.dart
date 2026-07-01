import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../app/di/injector.dart';
import '../../l10n/app_localizations.dart';
import '../auth/view_model/auth_session_cubit.dart';
import '../shared/widgets/primary_button.dart';
import '../theme/app_spacing.dart';
import 'view_model/home_cubit.dart';
import 'view_model/home_state.dart';

/// Initial route. Owns its [HomeCubit] (resolved from get_it) and renders via an
/// explicit-bloc [BlocBuilder] — no `BlocProvider`.
class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  late final HomeCubit _cubit = getIt<HomeCubit>();

  @override
  void dispose() {
    _cubit.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Store'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: l10n.logout,
            onPressed: () => getIt<AuthSessionCubit>().logout(),
          ),
        ],
      ),
      body: Center(
        child: BlocBuilder<HomeCubit, HomeState>(
          bloc: _cubit,
          builder: (context, state) {
            return Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  '${state.counter}',
                  style: Theme.of(context).textTheme.displaySmall,
                ),
                const SizedBox(height: AppSpacing.lg),
                PrimaryButton(label: 'Increment', onPressed: _cubit.increment),
                const SizedBox(height: AppSpacing.md),
                OutlinedButton.icon(
                  icon: const Icon(Icons.storefront_outlined),
                  label: Text(l10n.catalogTitle),
                  onPressed: () => context.push('/catalog'),
                ),
                const SizedBox(height: AppSpacing.md),
                OutlinedButton.icon(
                  icon: const Icon(Icons.inventory_2_outlined),
                  label: Text(l10n.inventoryTitle),
                  onPressed: () => context.push('/inventory'),
                ),
                const SizedBox(height: AppSpacing.md),
                OutlinedButton.icon(
                  icon: const Icon(Icons.point_of_sale_outlined),
                  label: Text(l10n.caixaTitle),
                  onPressed: () => context.push('/caixa'),
                ),
                const SizedBox(height: AppSpacing.md),
                OutlinedButton.icon(
                  icon: const Icon(Icons.shopping_cart_outlined),
                  label: Text(l10n.vendasPdvTitle),
                  onPressed: () => context.push('/vendas'),
                ),
                const SizedBox(height: AppSpacing.md),
                OutlinedButton.icon(
                  icon: const Icon(Icons.receipt_long_outlined),
                  label: Text(l10n.vendasHistoryTitle),
                  onPressed: () => context.push('/vendas/historico'),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
