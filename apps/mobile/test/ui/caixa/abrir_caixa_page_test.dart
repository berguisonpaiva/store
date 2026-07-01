import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fpdart/fpdart.dart';
import 'package:mobile/app/di/injector.dart';
import 'package:mobile/domain/caixa/entities/cash_session_status.dart';
import 'package:mobile/domain/caixa/entities/sessao_caixa_entity.dart';
import 'package:mobile/domain/caixa/usecases/abrir_caixa_usecase.dart';
import 'package:mobile/l10n/app_localizations.dart';
import 'package:mobile/ui/caixa/abrir_caixa_page.dart';
import 'package:mobile/ui/caixa/view_model/abrir_caixa_cubit.dart';
import 'package:mocktail/mocktail.dart';

class _MockAbrirCaixa extends Mock implements AbrirCaixaUseCase {}

Widget _app() => const MaterialApp(
  locale: Locale('en'),
  localizationsDelegates: AppLocalizations.localizationsDelegates,
  supportedLocales: AppLocalizations.supportedLocales,
  home: AbrirCaixaPage(),
);

final _session = SessaoCaixaEntity(
  id: 's1',
  status: CashSessionStatus.aberto,
  valorAberturaCents: 10000,
  abertaEm: DateTime(2026, 6, 29, 8),
);

void main() {
  late _MockAbrirCaixa abrirCaixa;

  setUp(() {
    abrirCaixa = _MockAbrirCaixa();
    getIt.registerFactory(() => AbrirCaixaCubit(abrirCaixa: abrirCaixa));
  });

  tearDown(() => getIt.reset());

  testWidgets('shows a validation error and does not call the use case for an '
      'empty amount', (tester) async {
    await tester.pumpWidget(_app());
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
    await tester.enterText(find.byType(TextFormField), '100,00');
    await tester.tap(find.byType(FilledButton));
    await tester.pump();

    verify(() => abrirCaixa(valorAberturaCents: 10000)).called(1);
  });
}
