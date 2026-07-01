import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../app/di/injector.dart';
import '../../l10n/app_localizations.dart';
import '../shared/feedback/app_toast.dart';
import '../theme/app_spacing.dart';
import 'inventory_l10n.dart';
import 'view_model/balance_lookup_cubit.dart';
import 'view_model/balance_lookup_state.dart';
import 'widgets/balance_summary_card.dart';

/// Consult the current/available balance of a variation by its id.
class BalanceLookupPage extends StatefulWidget {
  const BalanceLookupPage({super.key});

  @override
  State<BalanceLookupPage> createState() => _BalanceLookupPageState();
}

class _BalanceLookupPageState extends State<BalanceLookupPage> {
  late final BalanceLookupCubit _cubit = getIt<BalanceLookupCubit>();
  final _controller = TextEditingController();

  @override
  void dispose() {
    _cubit.close();
    _controller.dispose();
    super.dispose();
  }

  void _lookup() => _cubit.lookup(_controller.text);

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.inventoryBalanceTitle)),
      body: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: BlocConsumer<BalanceLookupCubit, BalanceLookupState>(
          bloc: _cubit,
          listener: (context, state) {
            if (state.status == BalanceLookupStatus.notFound) {
              AppToast.error(context, l10n.inventoryErrorVariationNotFound);
            } else if (state.status == BalanceLookupStatus.error) {
              AppToast.error(context, l10n.inventoryError(state.errorCode));
            }
          },
          builder: (context, state) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextField(
                  controller: _controller,
                  decoration: InputDecoration(
                    labelText: l10n.inventoryVariationIdLabel,
                  ),
                  enabled: !state.isLoading,
                  onSubmitted: (_) => _lookup(),
                ),
                const SizedBox(height: AppSpacing.md),
                FilledButton(
                  onPressed: state.isLoading ? null : _lookup,
                  child: state.isLoading
                      ? const SizedBox(
                          height: 18,
                          width: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Text(l10n.inventoryLookupAction),
                ),
                const SizedBox(height: AppSpacing.lg),
                if (state.status == BalanceLookupStatus.loaded &&
                    state.balance != null)
                  BalanceSummaryCard(balance: state.balance!)
                else if (state.status == BalanceLookupStatus.idle)
                  Text(
                    l10n.inventoryLookupHint,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
              ],
            );
          },
        ),
      ),
    );
  }
}
