import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/domain/vendas/entities/canal_venda.dart';
import 'package:mobile/domain/vendas/entities/item_venda_entity.dart';
import 'package:mobile/domain/vendas/entities/status_venda.dart';
import 'package:mobile/domain/vendas/entities/venda_entity.dart';
import 'package:mobile/l10n/app_localizations.dart';
import 'package:mobile/ui/vendas/venda_pdv_view.dart';
import 'package:mobile/ui/vendas/view_model/venda_pdv_cubit.dart';
import 'package:mobile/ui/vendas/view_model/venda_pdv_state.dart';
import 'package:mobile/ui/vendas/widgets/venda_item_tile.dart';
import 'package:mocktail/mocktail.dart';

class _MockVendaPdvCubit extends MockCubit<VendaPdvState>
    implements VendaPdvCubit {}

const _withItem = VendaEntity(
  id: 'v1',
  canal: CanalVenda.pdv,
  status: StatusVenda.aberta,
  usuarioId: 'u1',
  sessaoCaixaId: 's1',
  subtotalCents: 10000,
  descontoCents: 0,
  totalCents: 10000,
  itens: [
    ItemVendaEntity(
      id: 'i1',
      variacaoId: 'var1',
      quantidade: 2,
      precoUnitarioCents: 5000,
      totalCents: 10000,
    ),
  ],
);

const _finalized = VendaEntity(
  id: 'v1',
  canal: CanalVenda.pdv,
  status: StatusVenda.concluida,
  usuarioId: 'u1',
  sessaoCaixaId: 's1',
  subtotalCents: 10000,
  descontoCents: 0,
  totalCents: 10000,
  itens: [
    ItemVendaEntity(
      id: 'i1',
      variacaoId: 'var1',
      quantidade: 2,
      precoUnitarioCents: 5000,
      totalCents: 10000,
    ),
  ],
);

void main() {
  late _MockVendaPdvCubit cubit;

  setUp(() {
    cubit = _MockVendaPdvCubit();
  });

  Widget app({required VoidCallback onOpenCash}) => MaterialApp(
    locale: const Locale('en'),
    localizationsDelegates: AppLocalizations.localizationsDelegates,
    supportedLocales: AppLocalizations.supportedLocales,
    home: VendaPdvView(viewModel: cubit, onOpenCash: onOpenCash),
  );

  testWidgets('no open cash session blocks selling and offers to open', (
    tester,
  ) async {
    var opened = false;
    when(() => cubit.state).thenReturn(
      const VendaPdvState(status: VendaPdvStatus.noOpenCashSession),
    );

    await tester.pumpWidget(app(onOpenCash: () => opened = true));
    await tester.pump();

    expect(find.text('No open cash register'), findsOneWidget);
    await tester.tap(find.text('Open cash register'));
    await tester.pump();
    expect(opened, isTrue);
  });

  testWidgets('typing a code in the bip field adds an item', (tester) async {
    when(() => cubit.state).thenReturn(
      const VendaPdvState(status: VendaPdvStatus.loaded, venda: _withItem),
    );
    when(() => cubit.bip(code: any(named: 'code'), isSku: any(named: 'isSku')))
        .thenAnswer((_) async {});

    await tester.pumpWidget(app(onOpenCash: () {}));
    await tester.pump();

    await tester.enterText(find.byType(TextField), '789123');
    await tester.testTextInput.receiveAction(TextInputAction.done);
    await tester.pump();

    verify(() => cubit.bip(code: '789123', isSku: false)).called(1);
    // The item from state renders.
    expect(find.byType(VendaItemTile), findsOneWidget);
  });

  testWidgets('totals render from state', (tester) async {
    when(() => cubit.state).thenReturn(
      const VendaPdvState(status: VendaPdvStatus.loaded, venda: _withItem),
    );

    await tester.pumpWidget(app(onOpenCash: () {}));
    await tester.pump();

    expect(find.textContaining('Total'), findsWidgets);
    // Currency formatting yields a value containing 100.00 for 10000 cents.
    expect(find.textContaining('100.00'), findsWidgets);
  });

  testWidgets('finalized sale is read-only (no bip field, no actions)', (
    tester,
  ) async {
    when(() => cubit.state).thenReturn(
      const VendaPdvState(status: VendaPdvStatus.loaded, venda: _finalized),
    );

    await tester.pumpWidget(app(onOpenCash: () {}));
    await tester.pump();

    expect(find.text('This sale is finalized and read-only.'), findsOneWidget);
    // No bip field and no finalize/cancel actions in read-only mode.
    expect(find.byType(TextField), findsNothing);
    expect(find.text('Finalize sale'), findsNothing);
    expect(find.text('Cancel sale'), findsNothing);
  });
}
