import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fpdart/fpdart.dart';
import 'package:mobile/domain/caixa/entities/cash_session_status.dart';
import 'package:mobile/domain/caixa/entities/sessao_caixa_entity.dart';
import 'package:mobile/domain/caixa/errors/caixa_failure.dart';
import 'package:mobile/domain/caixa/repositories/caixa_repository.dart';
import 'package:mobile/domain/caixa/usecases/listar_sessoes_usecase.dart';
import 'package:mobile/ui/caixa/view_model/caixa_history_cubit.dart';
import 'package:mobile/ui/caixa/view_model/caixa_history_state.dart';
import 'package:mocktail/mocktail.dart';

class _MockListarSessoes extends Mock implements ListarSessoesUseCase {}

class _FakeFiltro extends Fake implements SessoesCaixaFiltro {}

final _sessao = SessaoCaixaEntity(
  id: 's1',
  status: CashSessionStatus.fechado,
  valorAberturaCents: 10000,
  abertaEm: DateTime(2026, 6, 29, 8),
  valorFechamentoCents: 31850,
  fechadaEm: DateTime(2026, 6, 29, 18),
);

void main() {
  late _MockListarSessoes listarSessoes;

  setUpAll(() => registerFallbackValue(_FakeFiltro()));

  setUp(() => listarSessoes = _MockListarSessoes());

  CaixaHistoryCubit build() =>
      CaixaHistoryCubit(listarSessoes: listarSessoes);

  blocTest<CaixaHistoryCubit, CaixaHistoryState>(
    'load success → loading then loaded with the operator sessions',
    setUp: () =>
        when(() => listarSessoes(any())).thenAnswer((_) async => right([_sessao])),
    build: build,
    act: (cubit) => cubit.load(),
    expect: () => [
      const CaixaHistoryState(status: CaixaHistoryStatus.loading),
      isA<CaixaHistoryState>()
          .having((s) => s.status, 'status', CaixaHistoryStatus.loaded)
          .having((s) => s.sessoes, 'sessoes', [_sessao]),
    ],
  );

  blocTest<CaixaHistoryCubit, CaixaHistoryState>(
    'load failure → loading then error with code',
    setUp: () => when(() => listarSessoes(any()))
        .thenAnswer((_) async => left(const CaixaNetworkFailure())),
    build: build,
    act: (cubit) => cubit.load(),
    expect: () => [
      const CaixaHistoryState(status: CaixaHistoryStatus.loading),
      isA<CaixaHistoryState>()
          .having((s) => s.status, 'status', CaixaHistoryStatus.error)
          .having((s) => s.errorCode, 'errorCode', 'caixa.network'),
    ],
  );

  blocTest<CaixaHistoryCubit, CaixaHistoryState>(
    'filterByStatus forwards the status filter and keeps it in state',
    setUp: () =>
        when(() => listarSessoes(any())).thenAnswer((_) async => right([_sessao])),
    build: build,
    act: (cubit) => cubit.filterByStatus(CashSessionStatus.fechado),
    verify: (cubit) {
      expect(cubit.state.filtroStatus, CashSessionStatus.fechado);
      final filtro = verify(() => listarSessoes(captureAny())).captured.single
          as SessoesCaixaFiltro;
      expect(filtro.status, CashSessionStatus.fechado);
    },
  );

  blocTest<CaixaHistoryCubit, CaixaHistoryState>(
    'filterByStatus(null) clears the filter',
    setUp: () =>
        when(() => listarSessoes(any())).thenAnswer((_) async => right([_sessao])),
    build: build,
    seed: () => const CaixaHistoryState(
      status: CaixaHistoryStatus.loaded,
      filtroStatus: CashSessionStatus.aberto,
    ),
    act: (cubit) => cubit.filterByStatus(null),
    verify: (cubit) => expect(cubit.state.filtroStatus, isNull),
  );
}
