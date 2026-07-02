import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/app/di/injector.dart';
import 'package:mobile/domain/caixa/entities/cash_session_status.dart';
import 'package:mobile/domain/caixa/entities/sessao_caixa_entity.dart';
import 'package:mobile/l10n/app_localizations.dart';
import 'package:mobile/ui/caixa/caixa_history_page.dart';
import 'package:mobile/ui/caixa/view_model/caixa_history_cubit.dart';
import 'package:mobile/ui/caixa/view_model/caixa_history_state.dart';
import 'package:mobile/ui/caixa/widgets/sessao_history_tile.dart';
import 'package:mocktail/mocktail.dart';

class _MockCaixaHistoryCubit extends MockCubit<CaixaHistoryState>
    implements CaixaHistoryCubit {}

final _sessao = SessaoCaixaEntity(
  id: 's1',
  status: CashSessionStatus.fechado,
  valorAberturaCents: 10000,
  abertaEm: DateTime(2026, 6, 29, 8),
  valorFechamentoCents: 31850,
  fechadaEm: DateTime(2026, 6, 29, 18),
);

void main() {
  late _MockCaixaHistoryCubit cubit;

  setUp(() {
    cubit = _MockCaixaHistoryCubit();
    when(() => cubit.load(status: any(named: 'status')))
        .thenAnswer((_) async {});
    when(() => cubit.filterByStatus(any())).thenAnswer((_) async {});
    getIt.registerFactory<CaixaHistoryCubit>(() => cubit);
  });

  tearDown(() => getIt.reset());

  Widget app({required void Function(String) onOpenSessao}) => MaterialApp(
    locale: const Locale('en'),
    localizationsDelegates: AppLocalizations.localizationsDelegates,
    supportedLocales: AppLocalizations.supportedLocales,
    home: CaixaHistoryPage(onOpenSessao: onOpenSessao),
  );

  testWidgets('renders the empty state', (tester) async {
    when(() => cubit.state).thenReturn(
      const CaixaHistoryState(status: CaixaHistoryStatus.loaded),
    );

    await tester.pumpWidget(app(onOpenSessao: (_) {}));
    await tester.pump();

    expect(find.text('No cash sessions found.'), findsOneWidget);
    expect(find.byType(SessaoHistoryTile), findsNothing);
  });

  testWidgets('renders loaded sessions and taps forward the id',
      (tester) async {
    String? opened;
    when(() => cubit.state).thenReturn(
      CaixaHistoryState(
        status: CaixaHistoryStatus.loaded,
        sessoes: [_sessao],
      ),
    );

    await tester.pumpWidget(app(onOpenSessao: (id) => opened = id));
    await tester.pump();

    expect(find.byType(SessaoHistoryTile), findsOneWidget);
    // Status badge and opening amount are visible inside the tile.
    expect(
      find.descendant(
        of: find.byType(SessaoHistoryTile),
        matching: find.text('Closed'),
      ),
      findsOneWidget,
    );
    expect(find.textContaining('100.00'), findsOneWidget);

    await tester.tap(find.byType(SessaoHistoryTile));
    await tester.pump();
    expect(opened, 's1');
  });

  testWidgets('tapping a status chip filters', (tester) async {
    when(() => cubit.state).thenReturn(
      CaixaHistoryState(
        status: CaixaHistoryStatus.loaded,
        sessoes: [_sessao],
      ),
    );

    await tester.pumpWidget(app(onOpenSessao: (_) {}));
    await tester.pump();

    await tester.tap(find.widgetWithText(ChoiceChip, 'Open'));
    await tester.pump();

    verify(() => cubit.filterByStatus(CashSessionStatus.aberto)).called(1);
  });
}
