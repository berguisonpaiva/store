import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fpdart/fpdart.dart';
import 'package:mobile/domain/vendas/entities/canal_venda.dart';
import 'package:mobile/domain/vendas/entities/forma_pagamento.dart';
import 'package:mobile/domain/vendas/entities/item_venda_entity.dart';
import 'package:mobile/domain/vendas/entities/status_venda.dart';
import 'package:mobile/domain/vendas/entities/venda_entity.dart';
import 'package:mobile/domain/vendas/errors/vendas_failure.dart';
import 'package:mobile/domain/vendas/repositories/vendas_repository.dart';
import 'package:mobile/domain/vendas/usecases/adicionar_item_usecase.dart';
import 'package:mobile/domain/vendas/usecases/aplicar_desconto_usecase.dart';
import 'package:mobile/domain/vendas/usecases/cancelar_venda_usecase.dart';
import 'package:mobile/domain/vendas/usecases/criar_venda_usecase.dart';
import 'package:mobile/domain/vendas/usecases/finalizar_venda_usecase.dart';
import 'package:mobile/domain/vendas/usecases/remover_item_usecase.dart';
import 'package:mobile/ui/vendas/view_model/venda_pdv_cubit.dart';
import 'package:mobile/ui/vendas/view_model/venda_pdv_state.dart';
import 'package:mocktail/mocktail.dart';

class _MockCriar extends Mock implements CriarVendaUseCase {}

class _MockAdicionar extends Mock implements AdicionarItemUseCase {}

class _MockRemover extends Mock implements RemoverItemUseCase {}

class _MockDesconto extends Mock implements AplicarDescontoUseCase {}

class _MockFinalizar extends Mock implements FinalizarVendaUseCase {}

class _MockCancelar extends Mock implements CancelarVendaUseCase {}

const _empty = VendaEntity(
  id: 'v1',
  canal: CanalVenda.pdv,
  status: StatusVenda.aberta,
  usuarioId: 'u1',
  sessaoCaixaId: 's1',
  subtotalCents: 0,
  descontoCents: 0,
  totalCents: 0,
);

const _withItem = VendaEntity(
  id: 'v1',
  canal: CanalVenda.pdv,
  status: StatusVenda.aberta,
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
);

void main() {
  setUpAll(() {
    registerFallbackValue(
      const AdicionarItemParams(quantidade: 1, sku: 'fallback'),
    );
    registerFallbackValue(const <PagamentoInput>[]);
  });

  late _MockCriar criar;
  late _MockAdicionar adicionar;
  late _MockRemover remover;
  late _MockDesconto desconto;
  late _MockFinalizar finalizar;
  late _MockCancelar cancelar;

  setUp(() {
    criar = _MockCriar();
    adicionar = _MockAdicionar();
    remover = _MockRemover();
    desconto = _MockDesconto();
    finalizar = _MockFinalizar();
    cancelar = _MockCancelar();
  });

  VendaPdvCubit build() => VendaPdvCubit(
    criarVenda: criar,
    adicionarItem: adicionar,
    removerItem: remover,
    aplicarDesconto: desconto,
    finalizarVenda: finalizar,
    cancelarVenda: cancelar,
  );

  blocTest<VendaPdvCubit, VendaPdvState>(
    'start → loading then loaded with the new sale',
    setUp: () => when(() => criar()).thenAnswer((_) async => right(_empty)),
    build: build,
    act: (cubit) => cubit.start(),
    expect: () => [
      const VendaPdvState(status: VendaPdvStatus.loading),
      isA<VendaPdvState>()
          .having((s) => s.status, 'status', VendaPdvStatus.loaded)
          .having((s) => s.venda, 'venda', _empty),
    ],
  );

  blocTest<VendaPdvCubit, VendaPdvState>(
    'no open cash session blocks selling',
    setUp: () => when(() => criar())
        .thenAnswer((_) async => left(const NoOpenCashSessionFailure())),
    build: build,
    act: (cubit) => cubit.start(),
    expect: () => [
      const VendaPdvState(status: VendaPdvStatus.loading),
      isA<VendaPdvState>().having(
        (s) => s.status,
        'status',
        VendaPdvStatus.noOpenCashSession,
      ),
    ],
  );

  blocTest<VendaPdvCubit, VendaPdvState>(
    'bip adds an item and totals recompute',
    setUp: () {
      when(() => criar()).thenAnswer((_) async => right(_empty));
      when(
        () => adicionar(
          vendaId: any(named: 'vendaId'),
          params: any(named: 'params'),
        ),
      ).thenAnswer((_) async => right(_withItem));
    },
    build: build,
    act: (cubit) async {
      await cubit.start();
      await cubit.bip(code: '789');
    },
    verify: (cubit) {
      expect(cubit.state.venda?.itens.length, 1);
      expect(cubit.state.subtotalCents, 10000);
      expect(cubit.state.totalCents, 10000);
      expect(cubit.state.opStatus, VendaOpStatus.success);
    },
  );

  blocTest<VendaPdvCubit, VendaPdvState>(
    'finalize blocked on PaymentMismatch surfaces a failure op',
    setUp: () {
      when(() => criar()).thenAnswer((_) async => right(_withItem));
      when(
        () => finalizar(
          vendaId: any(named: 'vendaId'),
          pagamentos: any(named: 'pagamentos'),
        ),
      ).thenAnswer((_) async => left(const PaymentMismatchFailure()));
    },
    build: build,
    act: (cubit) async {
      await cubit.start();
      await cubit.finalizar(const [
        PagamentoInput(forma: FormaPagamento.dinheiro, valorCents: 5000),
      ]);
    },
    verify: (cubit) {
      expect(cubit.state.opStatus, VendaOpStatus.failure);
      expect(cubit.state.opErrorCode, 'vendas.payment_mismatch');
    },
  );

  group('payment helpers', () {
    test('sumPayments adds all legs in cents', () {
      final total = VendaPdvCubit.sumPayments(const [
        PagamentoInput(forma: FormaPagamento.dinheiro, valorCents: 3000),
        PagamentoInput(forma: FormaPagamento.pix, valorCents: 7000),
      ]);
      expect(total, 10000);
    });

    test('singleCash builds one cash leg for the total', () {
      final legs = VendaPdvCubit.singleCash(9500);
      expect(legs.single.forma, FormaPagamento.dinheiro);
      expect(legs.single.valorCents, 9500);
    });
  });
}
