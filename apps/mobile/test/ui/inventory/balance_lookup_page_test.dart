import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fpdart/fpdart.dart';
import 'package:mobile/app/di/injector.dart';
import 'package:mobile/domain/inventory/entities/stock_balance_entity.dart';
import 'package:mobile/domain/inventory/errors/inventory_failure.dart';
import 'package:mobile/domain/inventory/usecases/get_balance_usecase.dart';
import 'package:mobile/l10n/app_localizations.dart';
import 'package:mobile/ui/inventory/balance_lookup_page.dart';
import 'package:mobile/ui/inventory/view_model/balance_lookup_cubit.dart';
import 'package:mobile/ui/inventory/widgets/balance_summary_card.dart';
import 'package:mocktail/mocktail.dart';

class _MockGetBalance extends Mock implements GetBalanceUseCase {}

const _balance = StockBalanceEntity(
  variacaoId: 'v1',
  saldoAtual: 10,
  quantidadeReservada: 2,
  saldoDisponivel: 8,
  estoqueMinimo: 3,
);

Widget _app() => const MaterialApp(
  locale: Locale('en'),
  localizationsDelegates: AppLocalizations.localizationsDelegates,
  supportedLocales: AppLocalizations.supportedLocales,
  home: BalanceLookupPage(),
);

void main() {
  late _MockGetBalance getBalance;

  setUp(() {
    getBalance = _MockGetBalance();
    getIt.registerFactory(() => BalanceLookupCubit(getBalance: getBalance));
  });

  tearDown(() => getIt.reset());

  testWidgets('shows the balance card after a successful lookup', (
    tester,
  ) async {
    when(() => getBalance(any())).thenAnswer((_) async => right(_balance));

    await tester.pumpWidget(_app());
    await tester.enterText(find.byType(TextField), 'v1');
    await tester.tap(find.byType(FilledButton));
    await tester.pumpAndSettle();

    expect(find.byType(BalanceSummaryCard), findsOneWidget);
    expect(find.text('8'), findsOneWidget);
  });

  testWidgets('shows an error toast when the variation is not found', (
    tester,
  ) async {
    when(() => getBalance(any())).thenAnswer(
      (_) async => left(const VariationNotFoundFailure()),
    );

    await tester.pumpWidget(_app());
    await tester.enterText(find.byType(TextField), 'missing');
    await tester.tap(find.byType(FilledButton));
    await tester.pump();
    await tester.pump();

    expect(find.byType(BalanceSummaryCard), findsNothing);
    expect(find.text('Variation not found.'), findsOneWidget);
  });
}
