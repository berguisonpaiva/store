import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fpdart/fpdart.dart';
import 'package:mobile/domain/caixa/entities/cash_session_status.dart';
import 'package:mobile/domain/caixa/entities/sessao_caixa_entity.dart';
import 'package:mobile/domain/caixa/errors/caixa_failure.dart';
import 'package:mobile/domain/caixa/usecases/fechar_caixa_usecase.dart';
import 'package:mobile/ui/caixa/view_model/fechar_caixa_cubit.dart';
import 'package:mobile/ui/caixa/view_model/fechar_caixa_state.dart';
import 'package:mocktail/mocktail.dart';

class _MockFecharCaixa extends Mock implements FecharCaixaUseCase {}

final _closed = SessaoCaixaEntity(
  id: 's1',
  status: CashSessionStatus.fechado,
  valorAberturaCents: 10000,
  abertaEm: DateTime(2026, 6, 29, 8),
  valorFechamentoCents: 31850,
  fechadaEm: DateTime(2026, 6, 29, 18),
);

void main() {
  late _MockFecharCaixa fecharCaixa;

  setUp(() => fecharCaixa = _MockFecharCaixa());

  FecharCaixaCubit build() =>
      FecharCaixaCubit(fecharCaixa: fecharCaixa, esperadoCents: 32000);

  test('starts with the expected amount and no divergence', () {
    final cubit = build();
    expect(cubit.state.esperadoCents, 32000);
    expect(cubit.state.contadoCents, isNull);
    expect(cubit.state.divergenciaCents, isNull);
    cubit.close();
  });

  blocTest<FecharCaixaCubit, FecharCaixaState>(
    'contadoChanged computes a negative divergence (shortage)',
    build: build,
    act: (cubit) => cubit.contadoChanged(31850),
    verify: (cubit) => expect(cubit.state.divergenciaCents, -150),
  );

  blocTest<FecharCaixaCubit, FecharCaixaState>(
    'contadoChanged computes a positive divergence (surplus)',
    build: build,
    act: (cubit) => cubit.contadoChanged(32500),
    verify: (cubit) => expect(cubit.state.divergenciaCents, 500),
  );

  blocTest<FecharCaixaCubit, FecharCaixaState>(
    'submit without a counted amount does nothing',
    build: build,
    act: (cubit) => cubit.submit(sessaoId: 's1'),
    expect: () => const <FecharCaixaState>[],
  );

  blocTest<FecharCaixaCubit, FecharCaixaState>(
    'submit success → submitting then success',
    setUp: () => when(
      () => fecharCaixa(
        sessaoId: any(named: 'sessaoId'),
        valorFechamentoCents: any(named: 'valorFechamentoCents'),
      ),
    ).thenAnswer((_) async => right(_closed)),
    build: build,
    act: (cubit) async {
      cubit.contadoChanged(31850);
      await cubit.submit(sessaoId: 's1');
    },
    expect: () => [
      isA<FecharCaixaState>()
          .having((s) => s.contadoCents, 'contado', 31850)
          .having((s) => s.status, 'status', FecharCaixaStatus.idle),
      isA<FecharCaixaState>()
          .having((s) => s.status, 'status', FecharCaixaStatus.submitting),
      isA<FecharCaixaState>()
          .having((s) => s.status, 'status', FecharCaixaStatus.success)
          .having((s) => s.session, 'session', _closed),
    ],
  );

  blocTest<FecharCaixaCubit, FecharCaixaState>(
    'submit pending sale → submitting then failure with code',
    setUp: () => when(
      () => fecharCaixa(
        sessaoId: any(named: 'sessaoId'),
        valorFechamentoCents: any(named: 'valorFechamentoCents'),
      ),
    ).thenAnswer((_) async => left(const PendingSaleInSessionFailure())),
    build: build,
    act: (cubit) async {
      cubit.contadoChanged(32000);
      await cubit.submit(sessaoId: 's1');
    },
    expect: () => [
      isA<FecharCaixaState>().having((s) => s.contadoCents, 'contado', 32000),
      isA<FecharCaixaState>()
          .having((s) => s.status, 'status', FecharCaixaStatus.submitting),
      isA<FecharCaixaState>()
          .having((s) => s.status, 'status', FecharCaixaStatus.failure)
          .having((s) => s.errorCode, 'errorCode', 'caixa.pending_sale'),
    ],
  );
}
