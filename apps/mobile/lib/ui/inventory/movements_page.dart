import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../app/di/injector.dart';
import '../../l10n/app_localizations.dart';
import '../shared/feedback/app_toast.dart';
import '../theme/app_spacing.dart';
import 'inventory_l10n.dart';
import 'view_model/movements_cubit.dart';
import 'view_model/movements_state.dart';
import 'widgets/movement_tile.dart';

/// Movement history for a variation, with an optional period filter.
class MovementsPage extends StatefulWidget {
  const MovementsPage({super.key});

  @override
  State<MovementsPage> createState() => _MovementsPageState();
}

class _MovementsPageState extends State<MovementsPage> {
  late final MovementsCubit _cubit = getIt<MovementsCubit>();
  final _controller = TextEditingController();
  DateTime? _from;
  DateTime? _to;

  @override
  void dispose() {
    _cubit.close();
    _controller.dispose();
    super.dispose();
  }

  void _load() =>
      _cubit.load(variacaoId: _controller.text, from: _from, to: _to);

  Future<void> _pick({required bool isFrom}) async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: now,
      firstDate: DateTime(now.year - 5),
      lastDate: DateTime(now.year + 1),
    );
    if (picked != null) {
      setState(() {
        if (isFrom) {
          _from = picked;
        } else {
          _to = picked;
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.inventoryMovementsTitle)),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextField(
                  controller: _controller,
                  decoration: InputDecoration(
                    labelText: l10n.inventoryVariationIdLabel,
                  ),
                  onSubmitted: (_) => _load(),
                ),
                const SizedBox(height: AppSpacing.sm),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => _pick(isFrom: true),
                        child: Text(
                          _from == null
                              ? l10n.inventoryPeriodFrom
                              : '${l10n.inventoryPeriodFrom}: ${_from!.toIso8601String().substring(0, 10)}',
                        ),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => _pick(isFrom: false),
                        child: Text(
                          _to == null
                              ? l10n.inventoryPeriodTo
                              : '${l10n.inventoryPeriodTo}: ${_to!.toIso8601String().substring(0, 10)}',
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.sm),
                FilledButton(
                  onPressed: _load,
                  child: Text(l10n.inventoryApplyFilter),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: BlocConsumer<MovementsCubit, MovementsState>(
              bloc: _cubit,
              listener: (context, state) {
                if (state.status == MovementsStatus.error) {
                  AppToast.error(context, l10n.inventoryError(state.errorCode));
                }
              },
              builder: (context, state) {
                if (state.isLoading) {
                  return const Center(child: CircularProgressIndicator());
                }
                final page = state.page;
                if (page == null || page.isEmpty) {
                  return Center(child: Text(l10n.inventoryEmptyMovements));
                }
                return ListView.builder(
                  itemCount: page.items.length,
                  itemBuilder: (context, i) =>
                      MovementTile(movement: page.items[i]),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
