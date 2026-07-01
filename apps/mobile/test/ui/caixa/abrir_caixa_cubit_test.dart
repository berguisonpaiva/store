import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fpdart/fpdart.dart';
import 'package:mobile/domain/caixa/entities/cash_session_status.dart';
import 'package:mobile/domain/caixa/entities/sessao_caixa_entity.dart';
import 'package:mobile/domain/caixa/errors/caixa_failure.dart';
import 'package:mobile/domain/caixa/usecases/abrir_caixa_usecase.dart';
import 'package:mobile/ui/caixa/view_model/abrir_caixa_cubit.dart';
import 'package:mobile/ui/caixa/view_model/abrir_caixa_state.dart';
import 'package:mocktail/mocktail.dart';

class _MockAbrirCaixa extends Mock implements AbrirCaixaUseCase {}

final _session = SessaoCaixaEntity(
  id: 's1',
  status: CashSessionStatus.aberto,
  valorAberturaCents: 10000,
  abertaEm: DateTime(2026, 6, 29, 8),
);

void main() {
  late _MockAbrirCaixa abrirCaixa;

  setUp(() => abrirCaixa = _MockAbrirCaixa());

  AbrirCaixaCubit build() => AbrirCaixaCubit(abrirCaixa: abrirCaixa);

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
