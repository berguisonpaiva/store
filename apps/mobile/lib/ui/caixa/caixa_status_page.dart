import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../app/di/injector.dart';
import '../../l10n/app_localizations.dart';
import '../shared/feedback/app_toast.dart';
import '../shared/widgets/primary_button.dart';
import '../theme/app_spacing.dart';
import 'caixa_l10n.dart';
import 'view_model/caixa_status_cubit.dart';
import 'view_model/caixa_status_state.dart';
import 'widgets/caixa_session_summary.dart';

/// Entry point of the cash feature: checks whether the operator has an open
/// session and branches to opening or to the active session.
class CaixaStatusPage extends StatefulWidget {
  const CaixaStatusPage({super.key});

  @override
  State<CaixaStatusPage> createState() => _CaixaStatusPageState();
}

class _CaixaStatusPageState extends State<CaixaStatusPage> {
  late final CaixaStatusCubit _cubit = getIt<CaixaStatusCubit>();

  @override
  void initState() {
    super.initState();
    _cubit.load();
  }

  @override
  void dispose() {
    _cubit.close();
    super.dispose();
  }

  Future<void> _openCash() async {
    // Reload regardless of the result: the open screen may have been replaced
    // by the active session (preventive already-open block).
    await context.push<bool>('/caixa/abrir');
    await _cubit.load();
  }

  Future<void> _goToSession(String sessaoId) async {
    await context.push<bool>('/caixa/sessao', extra: sessaoId);
    await _cubit.load();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.caixaTitle),
        actions: [
          IconButton(
            icon: const Icon(Icons.history),
            tooltip: l10n.caixaHistoryTitle,
            onPressed: () => context.push('/caixa/historico'),
          ),
        ],
      ),
      body: BlocConsumer<CaixaStatusCubit, CaixaStatusState>(
        bloc: _cubit,
        listener: (context, state) {
          if (state.status == CaixaStatusValue.error) {
            AppToast.error(context, l10n.caixaError(state.errorCode));
          }
        },
        builder: (context, state) {
          if (state.isLoading || state.status == CaixaStatusValue.idle) {
            return const Center(child: CircularProgressIndicator());
          }
          if (state.status == CaixaStatusValue.sessionOpen &&
              state.session != null) {
            return CaixaSessionSummary(
              session: state.session!,
              onOpenSession: () => _goToSession(state.session!.id),
            );
          }
          // noSession or error → offer to open.
          return Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Icon(
                  Icons.point_of_sale,
                  size: 64,
                  color: Theme.of(context).colorScheme.primary,
                ),
                const SizedBox(height: AppSpacing.md),
                Text(
                  l10n.caixaNoSessionTitle,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  l10n.caixaNoSessionMessage,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: AppSpacing.lg),
                PrimaryButton(label: l10n.caixaOpenAction, onPressed: _openCash),
              ],
            ),
          );
        },
      ),
    );
  }
}
