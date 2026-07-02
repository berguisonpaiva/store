import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fpdart/fpdart.dart';
import 'package:mobile/domain/caixa/entities/cash_session_status.dart';
import 'package:mobile/domain/caixa/entities/sessao_caixa_entity.dart';
import 'package:mobile/domain/caixa/errors/caixa_failure.dart';
import 'package:mobile/domain/caixa/usecases/abrir_caixa_usecase.dart';
import 'package:mobile/domain/caixa/usecases/obter_caixa_aberto_usecase.dart';
import 'package:mobile/ui/caixa/view_model/abrir_caixa_cubit.dart';
import 'package:mobile/ui/caixa/view_model/abrir_caixa_state.dart';
import 'package:mocktail/mocktail.dart';

class _MockAbrirCaixa extends Mock implements AbrirCaixaUseCase {}

class _MockObterCaixaAberto extends Mock implements ObterCaixaAbertoUseCase {}

final _session = SessaoCaixaEntity(
  id: 's1',
  status: CashSessionStatus.aberto,
  valorAberturaCents: 10000,
  abertaEm: DateTime(2026, 6, 29, 8),
);

void main() {
  late _MockAbrirCaixa abrirCaixa;
  late _MockObterCaixaAberto obterCaixaAberto;

  setUp(() {
    abrirCaixa = _MockAbrirCaixa();
    obterCaixaAberto = _MockObterCaixaAberto();
  });

  AbrirCaixaCubit build() => AbrirCaixaCubit(
    abrirCaixa: abrirCaixa,
    obterCaixaAberto: obterCaixaAberto,
  );

  group('checkOpenSession (preventive guard)', () {
    blocTest<AbrirCaixaCubit, AbrirCaixaState>(
      'no open session → checking then idle (form usable)',
      setUp: () => when(() => obterCaixaAberto())
          .thenAnswer((_) async => right(null)),
      build: build,
      act: (cubit) => cubit.checkOpenSession(),
      expect: () => const [
        AbrirCaixaState(status: AbrirCaixaStatus.checking),
        AbrirCaixaState(),
      ],
    );

    blocTest<AbrirCaixaCubit, AbrirCaixaState>(
      'session already ABERTA → checking then blocked with the active session',
      setUp: () => when(() => obterCaixaAberto())
          .thenAnswer((_) async => right(_session)),
      build: build,
      act: (cubit) => cubit.checkOpenSession(),
      expect: () => [
        const AbrirCaixaState(status: AbrirCaixaStatus.checking),
        isA<AbrirCaixaState>()
            .having((s) => s.status, 'status', AbrirCaixaStatus.blocked)
            .having((s) => s.activeSession, 'activeSession', _session),
      ],
    );

    blocTest<AbrirCaixaCubit, AbrirCaixaState>(
      'check failure → form stays usable (API remains authoritative)',
      setUp: () => when(() => obterCaixaAberto())
          .thenAnswer((_) async => left(const CaixaNetworkFailure())),
      build: build,
      act: (cubit) => cubit.checkOpenSession(),
      expect: () => const [
        AbrirCaixaState(status: AbrirCaixaStatus.checking),
        AbrirCaixaState(),
      ],
    );
  });

  blocTest<AbrirCaixaCubit, AbrirCaixaState>(
    'success → submitting then success with session',
    setUp: () =>
        when(() => abrirCaixa(valorAberturaCents: any(named: 'valorAberturaCents')))
            .thenAnswer((_) async => right(_session)),
    build: build,
    act: (cubit) => cubit.submit(valorAberturaCents: 10000),
    expect: () => [
      const AbrirCaixaState(status: AbrirCaixaStatus.submitting),
      isA<AbrirCaixaState>()
          .having((s) => s.status, 'status', AbrirCaixaStatus.success)
          .having((s) => s.session, 'session', _session),
    ],
  );

  blocTest<AbrirCaixaCubit, AbrirCaixaState>(
    'already open → submitting then failure with code',
    setUp: () =>
        when(() => abrirCaixa(valorAberturaCents: any(named: 'valorAberturaCents')))
            .thenAnswer((_) async => left(const CashSessionAlreadyOpenFailure())),
    build: build,
    act: (cubit) => cubit.submit(valorAberturaCents: 0),
    expect: () => [
      const AbrirCaixaState(status: AbrirCaixaStatus.submitting),
      isA<AbrirCaixaState>()
          .having((s) => s.status, 'status', AbrirCaixaStatus.failure)
          .having((s) => s.errorCode, 'errorCode', 'caixa.already_open'),
    ],
  );
}
