import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/l10n/app_localizations.dart';
import 'package:mobile/ui/caixa/widgets/cash_movement_sheet.dart';

Widget _host(void Function(CashMovementInput?) onResult) => MaterialApp(
  locale: const Locale('en'),
  localizationsDelegates: AppLocalizations.localizationsDelegates,
  supportedLocales: AppLocalizations.supportedLocales,
  home: Scaffold(
    body: Builder(
      builder: (context) => Center(
        child: ElevatedButton(
          onPressed: () async {
            final result = await CashMovementSheet.show(
              context,
              title: 'Withdrawal',
            );
            onResult(result);
          },
          child: const Text('open'),
        ),
      ),
    ),
  ),
);

void main() {
  testWidgets('blocks submit with an empty amount and observation', (
    tester,
  ) async {
    CashMovementInput? result;
    var called = false;
    await tester.pumpWidget(
      _host((r) {
        called = true;
        result = r;
      }),
    );

    await tester.tap(find.text('open'));
    await tester.pumpAndSettle();

    await tester.tap(find.widgetWithText(FilledButton, 'Save'));
    await tester.pump();

    expect(find.text('Enter the amount.'), findsOneWidget);
    expect(find.text('A note is required.'), findsOneWidget);
    expect(called, isFalse);
    expect(result, isNull);
  });

  testWidgets('blocks submit when the amount is not positive', (tester) async {
    await tester.pumpWidget(_host((_) {}));

    await tester.tap(find.text('open'));
    await tester.pumpAndSettle();

    await tester.enterText(
      find.widgetWithText(TextFormField, 'Amount'),
      '0',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Note'),
      'cofre',
    );
    await tester.tap(find.widgetWithText(FilledButton, 'Save'));
    await tester.pump();

    expect(find.text('Amount must be greater than zero.'), findsOneWidget);
  });

  testWidgets('returns the parsed input on a valid submit', (tester) async {
    CashMovementInput? result;
    await tester.pumpWidget(_host((r) => result = r));

    await tester.tap(find.text('open'));
    await tester.pumpAndSettle();

    await tester.enterText(
      find.widgetWithText(TextFormField, 'Amount'),
      '12,50',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Note'),
      'cofre',
    );
    await tester.tap(find.widgetWithText(FilledButton, 'Save'));
    await tester.pumpAndSettle();

    expect(result, isNotNull);
    expect(result!.valorCents, 1250);
    expect(result!.observacao, 'cofre');
  });
}
