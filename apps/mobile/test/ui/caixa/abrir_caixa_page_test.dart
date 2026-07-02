import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fpdart/fpdart.dart';
import 'package:mobile/app/di/injector.dart';
import 'package:mobile/domain/caixa/entities/cash_session_status.dart';
import 'package:mobile/domain/caixa/entities/sessao_caixa_entity.dart';
import 'package:mobile/domain/caixa/usecases/abrir_caixa_usecase.dart';
import 'package:mobile/domain/caixa/usecases/obter_caixa_aberto_usecase.dart';
import 'package:mobile/l10n/app_localizations.dart';
import 'package:mobile/ui/caixa/abrir_caixa_page.dart';
import 'package:mobile/ui/caixa/view_model/abrir_caixa_cubit.dart';
import 'package:mocktail/mocktail.dart';

class _MockAbrirCaixa extends Mock implements AbrirCaixaUseCase {}

class _MockObterCaixaAberto extends Mock implements ObterCaixaAbertoUseCase {}

Widget _app({void Function(String)? onGoToActiveSession}) => MaterialApp(
  locale: const Locale('en'),
  localizationsDelegates: AppLocalizations.localizationsDelegates,
  supportedLocales: AppLocalizations.supportedLocales,
  home: AbrirCaixaPage(onGoToActiveSession: onGoToActiveSession),
);

final _session = SessaoCaixaEntity(
  id: 's1',
  status: CashSessionStatus.aberto,
  valorAberturaCents: 10000,
  abertaEm: DateTime(2026, 6, 29, 8),
);

void main() {
  late _MockAbrirCaixa abrirCaixa;
  late _MockObterCaixaAberto obterCaixaAberto;

  setUp(() {
    abrirCaixa = _MockAbrirCaixa();
    obterCaixaAberto = _MockObterCaixaAberto();
    when(() => obterCaixaAberto()).thenAnswer((_) async => right(null));
    getIt.registerFactory(
      () => AbrirCaixaCubit(
        abrirCaixa: abrirCaixa,
        obterCaixaAberto: obterCaixaAberto,
      ),
    );
  });

  tearDown(() => getIt.reset());

  testWidgets('shows a validation error and does not call the use case for an '
      'empty amount', (tester) async {
    await tester.pumpWidget(_app());
    await tester.pump();

    await tester.tap(find.byType(FilledButton));
    await tester.pump();

    expect(find.text('Enter the opening amount.'), findsOneWidget);
    verifyNever(
      () => abrirCaixa(valorAberturaCents: any(named: 'valorAberturaCents')),
    );
  });

  testWidgets('submits the parsed amount on a valid form', (tester) async {
    when(
      () => abrirCaixa(valorAberturaCents: any(named: 'valorAberturaCents')),
    ).thenAnswer((_) async => right(_session));

    await tester.pumpWidget(_app());
    await tester.pump();

    await tester.enterText(find.byType(TextFormField), '100,00');
    await tester.tap(find.byType(FilledButton));
    await tester.pump();

    verify(() => abrirCaixa(valorAberturaCents: 10000)).called(1);
  });

  testWidgets('blocks the form and leads to the active session when a session '
      'is already open', (tester) async {
    when(() => obterCaixaAberto()).thenAnswer((_) async => right(_session));
    String? navigatedTo;

    await tester.pumpWidget(_app(onGoToActiveSession: (id) => navigatedTo = id));
    await tester.pump();

    // No form: the preventive guard blocked it.
    expect(find.byType(TextFormField), findsNothing);
    expect(find.text('Cash register already open'), findsOneWidget);

    await tester.tap(find.byType(FilledButton));
    await tester.pump();

    expect(navigatedTo, 's1');
    verifyNever(
      () => abrirCaixa(valorAberturaCents: any(named: 'valorAberturaCents')),
    );
  });
}
