import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fpdart/fpdart.dart';
import 'package:mobile/domain/inventory/entities/stock_balance_entity.dart';
import 'package:mobile/domain/inventory/errors/inventory_failure.dart';
import 'package:mobile/domain/inventory/usecases/get_balance_usecase.dart';
import 'package:mobile/ui/inventory/view_model/balance_lookup_cubit.dart';
import 'package:mobile/ui/inventory/view_model/balance_lookup_state.dart';
import 'package:mocktail/mocktail.dart';

class _MockGetBalance extends Mock implements GetBalanceUseCase {}

const _balance = StockBalanceEntity(
  variacaoId: 'v1',
  saldoAtual: 10,
  quantidadeReservada: 2,
  saldoDisponivel: 8,
  estoqueMinimo: 3,
);

void main() {
  late _MockGetBalance getBalance;

  setUp(() => getBalance = _MockGetBalance());

  BalanceLookupCubit build() => BalanceLookupCubit(getBalance: getBalance);

  blocTest<BalanceLookupCubit, BalanceLookupState>(
    'loaded → loading then loaded with the balance',
    setUp: () =>
        when(() => getBalance(any())).thenAnswer((_) async => right(_balance)),
    build: build,
    act: (cubit) => cubit.lookup('v1'),
    expect: () => const [
      BalanceLookupState(status: BalanceLookupStatus.loading),
      BalanceLookupState(
        status: BalanceLookupStatus.loaded,
        balance: _balance,
      ),
    ],
    verify: (_) => verify(() => getBalance('v1')).called(1),
  );

  blocTest<BalanceLookupCubit, BalanceLookupState>(
    'not found → loading then notFound',
    setUp: () => when(() => getBalance(any())).thenAnswer(
      (_) async => left(const VariationNotFoundFailure()),
    ),
    build: build,
    act: (cubit) => cubit.lookup('missing'),
    expect: () => [
      const BalanceLookupState(status: BalanceLookupStatus.loading),
      isA<BalanceLookupState>().having(
        (s) => s.status,
        'status',
        BalanceLookupStatus.notFound,
      ),
    ],
  );

  blocTest<BalanceLookupCubit, BalanceLookupState>(
    'blank input → no use case call, no emit',
    build: build,
    act: (cubit) => cubit.lookup('   '),
    expect: () => const <BalanceLookupState>[],
    verify: (_) => verifyNever(() => getBalance(any())),
  );
}
