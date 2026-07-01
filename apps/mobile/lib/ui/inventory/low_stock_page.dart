import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../app/di/injector.dart';
import '../../l10n/app_localizations.dart';
import '../shared/feedback/app_toast.dart';
import 'inventory_l10n.dart';
import 'view_model/low_stock_cubit.dart';
import 'view_model/low_stock_state.dart';
import 'widgets/low_stock_tile.dart';

/// Replenishment alerts: variations at or below their minimum stock.
class LowStockPage extends StatefulWidget {
  const LowStockPage({super.key});

  @override
  State<LowStockPage> createState() => _LowStockPageState();
}

class _LowStockPageState extends State<LowStockPage> {
  late final LowStockCubit _cubit = getIt<LowStockCubit>()..load();

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
        title: Text(l10n.inventoryLowStockTitle),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: l10n.inventoryRefresh,
            onPressed: () => _cubit.load(),
          ),
        ],
      ),
      body: BlocConsumer<LowStockCubit, LowStockState>(
        bloc: _cubit,
        listener: (context, state) {
          if (state.status == LowStockStatus.error) {
            AppToast.error(context, l10n.inventoryError(state.errorCode));
          }
        },
        builder: (context, state) {
          if (state.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          if (state.items.isEmpty) {
            return Center(child: Text(l10n.inventoryEmptyLowStock));
          }
          return RefreshIndicator(
            onRefresh: _cubit.load,
            child: ListView.builder(
              itemCount: state.items.length,
              itemBuilder: (context, i) =>
                  LowStockTile(item: state.items[i]),
            ),
          );
        },
      ),
    );
  }
}
