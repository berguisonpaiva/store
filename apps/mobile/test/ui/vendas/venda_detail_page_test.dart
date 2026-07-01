import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/app/di/injector.dart';
import 'package:mobile/domain/vendas/entities/canal_venda.dart';
import 'package:mobile/domain/vendas/entities/forma_pagamento.dart';
import 'package:mobile/domain/vendas/entities/item_venda_entity.dart';
import 'package:mobile/domain/vendas/entities/pagamento_entity.dart';
import 'package:mobile/domain/vendas/entities/status_venda.dart';
import 'package:mobile/domain/vendas/entities/venda_entity.dart';
import 'package:mobile/l10n/app_localizations.dart';
import 'package:mobile/ui/vendas/venda_detail_page.dart';
import 'package:mobile/ui/vendas/view_model/venda_detail_cubit.dart';
import 'package:mobile/ui/vendas/view_model/venda_detail_state.dart';
import 'package:mobile/ui/vendas/widgets/pagamento_tile.dart';
import 'package:mobile/ui/vendas/widgets/venda_item_tile.dart';
import 'package:mocktail/mocktail.dart';

class _MockVendaDetailCubit extends MockCubit<VendaDetailState>
    implements VendaDetailCubit {}

const _venda = VendaEntity(
  id: 'v1',
  numero: 7,
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
  pagamentos: [
    PagamentoEntity(id: 'p1', forma: FormaPagamento.pix, valorCents: 10000),
  ],
);

void main() {
  late _MockVendaDetailCubit cubit;

  setUp(() {
    cubit = _MockVendaDetailCubit();
    when(() => cubit.load(any())).thenAnswer((_) async {});
    getIt.registerFactory<VendaDetailCubit>(() => cubit);
  });

  tearDown(() => getIt.reset());

  Widget app() => MaterialApp(
    locale: const Locale('en'),
    localizationsDelegates: AppLocalizations.localizationsDelegates,
    supportedLocales: AppLocalizations.supportedLocales,
    home: const VendaDetailPage(vendaId: 'v1'),
  );

  testWidgets('renders items and payments of the loaded sale', (tester) async {
    when(() => cubit.state).thenReturn(
      const VendaDetailState(status: VendaDetailStatus.loaded, venda: _venda),
    );

    await tester.pumpWidget(app());
    await tester.pump();

    expect(find.text('Sale #7'), findsOneWidget);
    expect(find.byType(VendaItemTile), findsOneWidget);
    expect(find.byType(PagamentoTile), findsOneWidget);
  });

  testWidgets('shows the error message when load fails', (tester) async {
    when(() => cubit.state).thenReturn(
      const VendaDetailState(
        status: VendaDetailStatus.error,
        errorCode: 'vendas.not_found',
      ),
    );

    await tester.pumpWidget(app());
    await tester.pump();

    expect(find.text('Sale not found.'), findsOneWidget);
  });
}
