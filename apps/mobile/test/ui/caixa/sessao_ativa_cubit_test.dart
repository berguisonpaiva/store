import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fpdart/fpdart.dart';
import 'package:mobile/domain/caixa/entities/cash_movement_type.dart';
import 'package:mobile/domain/caixa/entities/movimentacao_caixa_entity.dart';
import 'package:mobile/domain/caixa/entities/resumo_sessao_entity.dart';
import 'package:mobile/domain/caixa/errors/caixa_failure.dart';
import 'package:mobile/domain/caixa/usecases/listar_movimentacoes_usecase.dart';
import 'package:mobile/domain/caixa/usecases/obter_resumo_sessao_usecase.dart';
import 'package:mobile/domain/caixa/usecases/registrar_sangria_usecase.dart';
import 'package:mobile/domain/caixa/usecases/registrar_suprimento_usecase.dart';
import 'package:mobile/ui/caixa/view_model/sessao_ativa_cubit.dart';
import 'package:mobile/ui/caixa/view_model/sessao_ativa_state.dart';
import 'package:mocktail/mocktail.dart';

class _MockResumo extends Mock implements ObterResumoSessaoUseCase {}

class _MockMovimentacoes extends Mock implements ListarMovimentacoesUseCase {}

class _MockSangria extends Mock implements RegistrarSangriaUseCase {}

class _MockSuprimento extends Mock implements RegistrarSuprimentoUseCase {}

const _resumo = ResumoSessaoEntity(
  aberturaCents: 10000,
  suprimentosCents: 5000,
  vendasDinheiroCents: 20000,
  sangriasCents: 3000,
  esperadoCents: 32000,
);

final _movements = [
  MovimentacaoCaixaEntity(
    id: 'm1',
    tipo: CashMovementType.suprimento,
    valorCents: 5000,
    criadaEm: DateTime(2026, 6, 29, 9),
  ),
];

void main() {
  late _MockResumo resumo;
  late _MockMovimentacoes movimentacoes;
  late _MockSangria sangria;
  late _MockSuprimento suprimento;

  setUp(() {
    resumo = _MockResumo();
    movimentacoes = _MockMovimentacoes();
    sangria = _MockSangria();
    suprimento = _MockSuprimento();
  });

  SessaoAtivaCubit build() => SessaoAtivaCubit(
    obterResumo: resumo,
    listarMovimentacoes: movimentacoes,
    registrarSangria: sangria,
    registrarSuprimento: suprimento,
  );

  blocTest<SessaoAtivaCubit, SessaoAtivaState>(
    'load success → loading then loaded with resumo and movements',
    setUp: () {
      when(() => resumo('s1')).thenAnswer((_) async => right(_resumo));
      when(() => movimentacoes('s1'))
          .thenAnswer((_) async => right(_movements));
    },
    build: build,
    act: (cubit) => cubit.load('s1'),
    expect: () => [
      isA<SessaoAtivaState>()
          .having((s) => s.status, 'status', SessaoAtivaStatus.loading),
      isA<SessaoAtivaState>()
          .having((s) => s.status, 'status', SessaoAtivaStatus.loaded)
          .having((s) => s.resumo, 'resumo', _resumo)
          .having((s) => s.movimentacoes.length, 'movements', 1),
    ],
  );

  blocTest<SessaoAtivaCubit, SessaoAtivaState>(
    'load resumo failure → loading then error',
    setUp: () => when(() => resumo('s1'))
        .thenAnswer((_) async => left(const CashSessionNotFoundFailure())),
    build: build,
    act: (cubit) => cubit.load('s1'),
    expect: () => [
      isA<SessaoAtivaState>()
          .having((s) => s.status, 'status', SessaoAtivaStatus.loading),
      isA<SessaoAtivaState>()
          .having((s) => s.status, 'status', SessaoAtivaStatus.error)
          .having((s) => s.errorCode, 'errorCode', 'caixa.not_found'),
    ],
  );

  blocTest<SessaoAtivaCubit, SessaoAtivaState>(
    'sangria success reloads the summary',
    setUp: () {
      when(
        () => sangria(
          sessaoId: any(named: 'sessaoId'),
          valorCents: any(named: 'valorCents'),
          observacao: any(named: 'observacao'),
        ),
      ).thenAnswer(
        (_) async => right(_movements.first),
      );
      when(() => resumo('s1')).thenAnswer((_) async => right(_resumo));
      when(() => movimentacoes('s1'))
          .thenAnswer((_) async => right(_movements));
    },
    build: build,
    act: (cubit) => cubit.registrarSangria(
      sessaoId: 's1',
      valorCents: 1000,
      observacao: 'cofre',
    ),
    verify: (_) {
      verify(() => resumo('s1')).called(1);
      verify(() => movimentacoes('s1')).called(1);
    },
  );

  blocTest<SessaoAtivaCubit, SessaoAtivaState>(
    'sangria failure → submitting then failure with op code',
    setUp: () => when(
      () => sangria(
        sessaoId: any(named: 'sessaoId'),
        valorCents: any(named: 'valorCents'),
        observacao: any(named: 'observacao'),
      ),
    ).thenAnswer((_) async => left(const InvalidCashAmountFailure())),
    build: build,
    act: (cubit) => cubit.registrarSangria(
      sessaoId: 's1',
      valorCents: 0,
      observacao: 'x',
    ),
    expect: () => [
      isA<SessaoAtivaState>()
          .having((s) => s.opStatus, 'opStatus', CashOpStatus.submitting),
      isA<SessaoAtivaState>()
          .having((s) => s.opStatus, 'opStatus', CashOpStatus.failure)
          .having((s) => s.opErrorCode, 'opErrorCode', 'caixa.invalid_amount'),
    ],
  );
}
