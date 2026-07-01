import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fpdart/fpdart.dart';
import 'package:mobile/app/di/injector.dart';
import 'package:mobile/domain/caixa/entities/cash_session_status.dart';
import 'package:mobile/domain/caixa/entities/sessao_caixa_entity.dart';
import 'package:mobile/domain/caixa/usecases/fechar_caixa_usecase.dart';
import 'package:mobile/l10n/app_localizations.dart';
import 'package:mobile/ui/caixa/fechar_caixa_page.dart';
import 'package:mocktail/mocktail.dart';

class _MockFecharCaixa extends Mock implements FecharCaixaUseCase {}

const _args = FecharCaixaArgs(sessaoId: 's1', esperadoCents: 32000);

Widget _app() => const MaterialApp(
  locale: Locale('en'),
  localizationsDelegates: AppLocalizations.localizationsDelegates,
  supportedLocales: AppLocalizations.supportedLocales,
  home: FecharCaixaPage(args: _args),
);

final _closed = SessaoCaixaEntity(
  id: 's1',
  status: CashSessionStatus.fechado,
  valorAberturaCents: 10000,
  abertaEm: DateTime(2026, 6, 29, 8),
  valorFechamentoCents: 31850,
  fechadaEm: DateTime(2026, 6, 29, 18),
);

void main() {
  late _MockFecharCaixa fecharCaixa;

  setUp(() {
    fecharCaixa = _MockFecharCaixa();
    getIt.registerFactory<FecharCaixaUseCase>(() => fecharCaixa);
  });

  tearDown(() => getIt.reset());

  testWidgets('shows the divergence after entering the counted amount', (
    tester,
  ) async {
    await tester.pumpWidget(_app());
    await tester.enterText(find.byType(TextFormField), '318,50');
    await tester.pump();

    // Shortage of R$1.50 (esperado 320.00 − contado 318.50).
    expect(find.text('Shortage'), findsOneWidget);
    expect(find.textContaining('1.50'), findsWidgets);
  });

  testWidgets('requires confirmation before closing', (tester) async {
    when(
      () => fecharCaixa(
        sessaoId: any(named: 'sessaoId'),
        valorFechamentoCents: any(named: 'valorFechamentoCents'),
      ),
    ).thenAnswer((_) async => right(_closed));

    await tester.pumpWidget(_app());
    await tester.enterText(find.byType(TextFormField), '318,50');
    await tester.pump();

    // Tap close → confirmation dialog appears; no request yet.
    await tester.tap(find.widgetWithText(FilledButton, 'Close cash register'));
    await tester.pump();

    expect(find.text('Close cash register?'), findsOneWidget);
    verifyNever(
      () => fecharCaixa(
        sessaoId: any(named: 'sessaoId'),
        valorFechamentoCents: any(named: 'valorFechamentoCents'),
      ),
    );

    // Confirm → request fires with the counted amount in cents.
    await tester.tap(find.text('Confirm and close'));
    await tester.pump();

    verify(
      () => fecharCaixa(sessaoId: 's1', valorFechamentoCents: 31850),
    ).called(1);
  });
}
