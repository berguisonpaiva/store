import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/app/di/injector.dart';
import 'package:mobile/domain/caixa/entities/cash_movement_type.dart';
import 'package:mobile/domain/caixa/entities/cash_session_status.dart';
import 'package:mobile/domain/caixa/entities/movimentacao_caixa_entity.dart';
import 'package:mobile/domain/caixa/entities/resumo_sessao_entity.dart';
import 'package:mobile/domain/caixa/entities/sessao_caixa_entity.dart';
import 'package:mobile/l10n/app_localizations.dart';
import 'package:mobile/ui/caixa/caixa_detail_page.dart';
import 'package:mobile/ui/caixa/view_model/caixa_detail_cubit.dart';
import 'package:mobile/ui/caixa/view_model/caixa_detail_state.dart';
import 'package:mobile/ui/caixa/widgets/movimentacao_tile.dart';
import 'package:mobile/ui/caixa/widgets/resumo_card.dart';
import 'package:mocktail/mocktail.dart';

class _MockCaixaDetailCubit extends MockCubit<CaixaDetailState>
    implements CaixaDetailCubit {}

final _sessao = SessaoCaixaEntity(
  id: 's1',
  status: CashSessionStatus.fechado,
  valorAberturaCents: 10000,
  abertaEm: DateTime(2026, 6, 29, 8),
  valorFechamentoCents: 31850,
  fechadaEm: DateTime(2026, 6, 29, 18),
);

const _resumo = ResumoSessaoEntity(
  aberturaCents: 10000,
  suprimentosCents: 5000,
  vendasDinheiroCents: 20000,
  sangriasCents: 3000,
  esperadoCents: 32000,
  contadoCents: 31850,
  divergenciaCents: -150,
);

final _movement = MovimentacaoCaixaEntity(
  id: 'm1',
  tipo: CashMovementType.sangria,
  valorCents: 3000,
  criadaEm: DateTime(2026, 6, 29, 12),
);

void main() {
  late _MockCaixaDetailCubit cubit;

  setUp(() {
    cubit = _MockCaixaDetailCubit();
    when(() => cubit.load(any())).thenAnswer((_) async {});
    getIt.registerFactory<CaixaDetailCubit>(() => cubit);
  });

  tearDown(() => getIt.reset());

  Widget app() => MaterialApp(
    locale: const Locale('en'),
    localizationsDelegates: AppLocalizations.localizationsDelegates,
    supportedLocales: AppLocalizations.supportedLocales,
    home: const CaixaDetailPage(sessaoId: 's1'),
  );

  testWidgets('renders session data, resumo and movements read-only',
      (tester) async {
    when(() => cubit.state).thenReturn(
      CaixaDetailState(
        status: CaixaDetailStatus.loaded,
        sessao: _sessao,
        resumo: _resumo,
        movimentacoes: [_movement],
      ),
    );

    await tester.pumpWidget(app());
    await tester.pump();

    expect(find.text('Closed'), findsOneWidget);
    expect(find.byType(ResumoCard), findsOneWidget);
    expect(find.byType(MovimentacaoTile), findsOneWidget);
    // Read-only: no action buttons to alter the session.
    expect(find.byType(FilledButton), findsNothing);
  });

  testWidgets('shows the error message when the read is denied (RN03)',
      (tester) async {
    when(() => cubit.state).thenReturn(
      const CaixaDetailState(
        status: CaixaDetailStatus.error,
        errorCode: 'caixa.access_denied',
      ),
    );

    await tester.pumpWidget(app());
    await tester.pump();

    expect(
      find.text('You do not have access to this cash session.'),
      findsOneWidget,
    );
  });
}
