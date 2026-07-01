import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/app/di/injector.dart';
import 'package:mobile/domain/vendas/entities/canal_venda.dart';
import 'package:mobile/domain/vendas/entities/status_venda.dart';
import 'package:mobile/domain/vendas/entities/venda_entity.dart';
import 'package:mobile/l10n/app_localizations.dart';
import 'package:mobile/ui/vendas/vendas_history_page.dart';
import 'package:mobile/ui/vendas/view_model/vendas_history_cubit.dart';
import 'package:mobile/ui/vendas/view_model/vendas_history_state.dart';
import 'package:mobile/ui/vendas/widgets/venda_history_tile.dart';
import 'package:mocktail/mocktail.dart';

class _MockVendasHistoryCubit extends MockCubit<VendasHistoryState>
    implements VendasHistoryCubit {}

const _venda = VendaEntity(
  id: 'v1',
  numero: 42,
  canal: CanalVenda.pdv,
  status: StatusVenda.concluida,
  usuarioId: 'u1',
  sessaoCaixaId: 's1',
  subtotalCents: 10000,
  descontoCents: 0,
  totalCents: 10000,
);

void main() {
  late _MockVendasHistoryCubit cubit;

  setUp(() {
    cubit = _MockVendasHistoryCubit();
    when(() => cubit.load(status: any(named: 'status')))
        .thenAnswer((_) async {});
    when(() => cubit.filterByStatus(any())).thenAnswer((_) async {});
    getIt.registerFactory<VendasHistoryCubit>(() => cubit);
  });

  tearDown(() => getIt.reset());

  Widget app({required void Function(String) onOpenVenda}) => MaterialApp(
    locale: const Locale('en'),
    localizationsDelegates: AppLocalizations.localizationsDelegates,
    supportedLocales: AppLocalizations.supportedLocales,
    home: VendasHistoryPage(onOpenVenda: onOpenVenda),
  );

  testWidgets('renders the empty state', (tester) async {
    when(() => cubit.state).thenReturn(
      const VendasHistoryState(status: VendasHistoryStatus.loaded),
    );

    await tester.pumpWidget(app(onOpenVenda: (_) {}));
    await tester.pump();

    expect(find.text('No sales found.'), findsOneWidget);
    expect(find.byType(VendaHistoryTile), findsNothing);
  });

  testWidgets('renders loaded sales and taps forward the id', (tester) async {
    String? opened;
    when(() => cubit.state).thenReturn(
      const VendasHistoryState(
        status: VendasHistoryStatus.loaded,
        vendas: [_venda],
      ),
    );

    await tester.pumpWidget(app(onOpenVenda: (id) => opened = id));
    await tester.pump();

    expect(find.byType(VendaHistoryTile), findsOneWidget);
    expect(find.text('Sale #42'), findsOneWidget);

    await tester.tap(find.byType(VendaHistoryTile));
    await tester.pump();
    expect(opened, 'v1');
  });

  testWidgets('tapping a status chip filters', (tester) async {
    when(() => cubit.state).thenReturn(
      const VendasHistoryState(
        status: VendasHistoryStatus.loaded,
        vendas: [_venda],
      ),
    );

    await tester.pumpWidget(app(onOpenVenda: (_) {}));
    await tester.pump();

    await tester.tap(find.text('Cancelled'));
    await tester.pump();

    verify(() => cubit.filterByStatus(StatusVenda.cancelada)).called(1);
  });
}
