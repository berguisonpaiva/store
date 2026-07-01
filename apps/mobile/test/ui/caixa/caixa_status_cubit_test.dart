import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fpdart/fpdart.dart';
import 'package:mobile/domain/caixa/entities/cash_session_status.dart';
import 'package:mobile/domain/caixa/entities/sessao_caixa_entity.dart';
import 'package:mobile/domain/caixa/errors/caixa_failure.dart';
import 'package:mobile/domain/caixa/usecases/obter_caixa_aberto_usecase.dart';
import 'package:mobile/ui/caixa/view_model/caixa_status_cubit.dart';
import 'package:mobile/ui/caixa/view_model/caixa_status_state.dart';
import 'package:mocktail/mocktail.dart';

class _MockObterCaixaAberto extends Mock implements ObterCaixaAbertoUseCase {}

final _session = SessaoCaixaEntity(
  id: 's1',
  status: CashSessionStatus.aberto,
  valorAberturaCents: 10000,
  abertaEm: DateTime(2026, 6, 29, 8),
);

void main() {
  late _MockObterCaixaAberto obterCaixaAberto;

  setUp(() => obterCaixaAberto = _MockObterCaixaAberto());

  CaixaStatusCubit build() =>
      CaixaStatusCubit(obterCaixaAberto: obterCaixaAberto);

  blocTest<CaixaStatusCubit, CaixaStatusState>(
    'no open session → loading then noSession',
    setUp: () => when(obterCaixaAberto.call).thenAnswer((_) async => right(null)),
    build: build,
    act: (cubit) => cubit.load(),
    expect: () => const [
      CaixaStatusState(status: CaixaStatusValue.loading),
      CaixaStatusState(status: CaixaStatusValue.noSession),
    ],
  );

  blocTest<CaixaStatusCubit, CaixaStatusState>(
    'open session → loading then sessionOpen with session',
    setUp: () =>
        when(obterCaixaAberto.call).thenAnswer((_) async => right(_session)),
    build: build,
    act: (cubit) => cubit.load(),
    expect: () => [
      const CaixaStatusState(status: CaixaStatusValue.loading),
      isA<CaixaStatusState>()
          .having((s) => s.status, 'status', CaixaStatusValue.sessionOpen)
          .having((s) => s.session, 'session', _session),
    ],
  );

  blocTest<CaixaStatusCubit, CaixaStatusState>(
    'failure → loading then error with code',
    setUp: () => when(obterCaixaAberto.call)
        .thenAnswer((_) async => left(const CaixaNetworkFailure())),
    build: build,
    act: (cubit) => cubit.load(),
    expect: () => [
      const CaixaStatusState(status: CaixaStatusValue.loading),
      isA<CaixaStatusState>()
          .having((s) => s.status, 'status', CaixaStatusValue.error)
          .having((s) => s.errorCode, 'errorCode', 'caixa.network'),
    ],
  );
}
