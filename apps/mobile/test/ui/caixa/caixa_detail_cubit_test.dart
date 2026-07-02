import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fpdart/fpdart.dart';
import 'package:mobile/domain/caixa/entities/cash_movement_type.dart';
import 'package:mobile/domain/caixa/entities/cash_session_status.dart';
import 'package:mobile/domain/caixa/entities/movimentacao_caixa_entity.dart';
import 'package:mobile/domain/caixa/entities/resumo_sessao_entity.dart';
import 'package:mobile/domain/caixa/entities/sessao_caixa_entity.dart';
import 'package:mobile/domain/caixa/errors/caixa_failure.dart';
import 'package:mobile/domain/caixa/usecases/listar_movimentacoes_usecase.dart';
import 'package:mobile/domain/caixa/usecases/obter_resumo_sessao_usecase.dart';
import 'package:mobile/domain/caixa/usecases/obter_sessao_usecase.dart';
import 'package:mobile/ui/caixa/view_model/caixa_detail_cubit.dart';
import 'package:mobile/ui/caixa/view_model/caixa_detail_state.dart';
import 'package:mocktail/mocktail.dart';

class _MockObterSessao extends Mock implements ObterSessaoUseCase {}

class _MockObterResumo extends Mock implements ObterResumoSessaoUseCase {}

class _MockListarMovimentacoes extends Mock
    implements ListarMovimentacoesUseCase {}

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
  late _MockObterSessao obterSessao;
  late _MockObterResumo obterResumo;
  late _MockListarMovimentacoes listarMovimentacoes;

  setUp(() {
    obterSessao = _MockObterSessao();
    obterResumo = _MockObterResumo();
    listarMovimentacoes = _MockListarMovimentacoes();
  });

  CaixaDetailCubit build() => CaixaDetailCubit(
    obterSessao: obterSessao,
    obterResumo: obterResumo,
    listarMovimentacoes: listarMovimentacoes,
  );

  blocTest<CaixaDetailCubit, CaixaDetailState>(
    'load success → loading then loaded with session, resumo and movements',
    setUp: () {
      when(() => obterSessao(any())).thenAnswer((_) async => right(_sessao));
      when(() => obterResumo(any())).thenAnswer((_) async => right(_resumo));
      when(() => listarMovimentacoes(any()))
          .thenAnswer((_) async => right([_movement]));
    },
    build: build,
    act: (cubit) => cubit.load('s1'),
    expect: () => [
      const CaixaDetailState(status: CaixaDetailStatus.loading),
      isA<CaixaDetailState>()
          .having((s) => s.status, 'status', CaixaDetailStatus.loaded)
          .having((s) => s.sessao, 'sessao', _sessao)
          .having((s) => s.resumo, 'resumo', _resumo)
          .having((s) => s.movimentacoes, 'movimentacoes', [_movement]),
    ],
  );

  blocTest<CaixaDetailCubit, CaixaDetailState>(
    'access denied on the session (RN03) → error with code, nothing else '
    'fetched',
    setUp: () => when(() => obterSessao(any()))
        .thenAnswer((_) async => left(const CashSessionAccessDeniedFailure())),
    build: build,
    act: (cubit) => cubit.load('other'),
    expect: () => [
      const CaixaDetailState(status: CaixaDetailStatus.loading),
      isA<CaixaDetailState>()
          .having((s) => s.status, 'status', CaixaDetailStatus.error)
          .having((s) => s.errorCode, 'errorCode', 'caixa.access_denied'),
    ],
    verify: (_) {
      verifyNever(() => obterResumo(any()));
      verifyNever(() => listarMovimentacoes(any()));
    },
  );

  blocTest<CaixaDetailCubit, CaixaDetailState>(
    'resumo failure → error state',
    setUp: () {
      when(() => obterSessao(any())).thenAnswer((_) async => right(_sessao));
      when(() => obterResumo(any()))
          .thenAnswer((_) async => left(const CaixaNetworkFailure()));
    },
    build: build,
    act: (cubit) => cubit.load('s1'),
    expect: () => [
      const CaixaDetailState(status: CaixaDetailStatus.loading),
      isA<CaixaDetailState>()
          .having((s) => s.status, 'status', CaixaDetailStatus.error)
          .having((s) => s.errorCode, 'errorCode', 'caixa.network'),
    ],
  );
}
