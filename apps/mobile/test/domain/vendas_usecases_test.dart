import 'package:flutter_test/flutter_test.dart';
import 'package:fpdart/fpdart.dart';
import 'package:mobile/domain/vendas/entities/canal_venda.dart';
import 'package:mobile/domain/vendas/entities/forma_pagamento.dart';
import 'package:mobile/domain/vendas/entities/resumo_vendas_entity.dart';
import 'package:mobile/domain/vendas/entities/status_venda.dart';
import 'package:mobile/domain/vendas/entities/tipo_desconto.dart';
import 'package:mobile/domain/vendas/entities/venda_entity.dart';
import 'package:mobile/domain/vendas/errors/vendas_failure.dart';
import 'package:mobile/domain/vendas/repositories/vendas_repository.dart';
import 'package:mobile/domain/vendas/usecases/adicionar_item_usecase.dart';
import 'package:mobile/domain/vendas/usecases/aplicar_desconto_usecase.dart';
import 'package:mobile/domain/vendas/usecases/buscar_venda_usecase.dart';
import 'package:mobile/domain/vendas/usecases/cancelar_venda_usecase.dart';
import 'package:mobile/domain/vendas/usecases/criar_venda_usecase.dart';
import 'package:mobile/domain/vendas/usecases/finalizar_venda_usecase.dart';
import 'package:mobile/domain/vendas/usecases/listar_vendas_usecase.dart';
import 'package:mobile/domain/vendas/usecases/remover_item_usecase.dart';
import 'package:mobile/domain/vendas/usecases/resumo_vendas_usecase.dart';

/// In-memory fake implementing the domain contract.
class _FakeVendasRepository implements VendasRepository {
  Either<VendasFailure, VendaEntity> criarResult = right(_venda);
  Either<VendasFailure, VendaEntity> adicionarResult = right(_venda);
  Either<VendasFailure, VendaEntity> removerResult = right(_venda);
  Either<VendasFailure, VendaEntity> descontoResult = right(_venda);
  Either<VendasFailure, VendaEntity> finalizarResult = right(_venda);
  Either<VendasFailure, VendaEntity> cancelarResult = right(_venda);
  Either<VendasFailure, VendaEntity> buscarResult = right(_venda);
  Either<VendasFailure, List<VendaEntity>> listarResult = right([_venda]);
  Either<VendasFailure, ResumoVendasEntity> resumoResult = right(_resumo);

  AdicionarItemParams? lastItemParams;
  num? lastDescontoValor;
  TipoDesconto? lastDescontoTipo;
  List<PagamentoInput>? lastPagamentos;
  bool criarCalled = false;

  @override
  Future<Either<VendasFailure, VendaEntity>> criar() async {
    criarCalled = true;
    return criarResult;
  }

  @override
  Future<Either<VendasFailure, VendaEntity>> adicionarItem({
    required String vendaId,
    required AdicionarItemParams params,
  }) async {
    lastItemParams = params;
    return adicionarResult;
  }

  @override
  Future<Either<VendasFailure, VendaEntity>> removerItem({
    required String vendaId,
    required String itemId,
  }) async => removerResult;

  @override
  Future<Either<VendasFailure, VendaEntity>> aplicarDesconto({
    required String vendaId,
    required TipoDesconto tipo,
    required num valor,
  }) async {
    lastDescontoTipo = tipo;
    lastDescontoValor = valor;
    return descontoResult;
  }

  @override
  Future<Either<VendasFailure, VendaEntity>> finalizar({
    required String vendaId,
    required List<PagamentoInput> pagamentos,
  }) async {
    lastPagamentos = pagamentos;
    return finalizarResult;
  }

  @override
  Future<Either<VendasFailure, VendaEntity>> cancelar(String vendaId) async =>
      cancelarResult;

  @override
  Future<Either<VendasFailure, VendaEntity>> buscar(String vendaId) async =>
      buscarResult;

  @override
  Future<Either<VendasFailure, List<VendaEntity>>> listar(
    VendasFiltro filtro,
  ) async => listarResult;

  @override
  Future<Either<VendasFailure, ResumoVendasEntity>> resumo(
    VendasFiltro filtro,
  ) async => resumoResult;
}

const _venda = VendaEntity(
  id: 'v1',
  canal: CanalVenda.pdv,
  status: StatusVenda.aberta,
  usuarioId: 'u1',
  sessaoCaixaId: 's1',
  subtotalCents: 10000,
  descontoCents: 0,
  totalCents: 10000,
);

const _resumo = ResumoVendasEntity(
  quantidade: 3,
  subtotalCents: 30000,
  descontoCents: 1000,
  totalCents: 29000,
);

void main() {
  late _FakeVendasRepository repo;

  setUp(() => repo = _FakeVendasRepository());

  group('CriarVendaUseCase', () {
    test('forwards to the repository (happy path)', () async {
      final result = await CriarVendaUseCase(repo)();
      expect(result.isRight(), isTrue);
      expect(repo.criarCalled, isTrue);
    });

    test('propagates NoOpenCashSessionFailure', () async {
      repo.criarResult = left(const NoOpenCashSessionFailure());
      final result = await CriarVendaUseCase(repo)();
      expect(result.getLeft().toNullable(), isA<NoOpenCashSessionFailure>());
    });
  });

  group('AdicionarItemUseCase', () {
    test('rejects a non-positive quantity without hitting the repo', () async {
      final result = await AdicionarItemUseCase(repo)(
        vendaId: 'v1',
        params: const AdicionarItemParams(quantidade: 0, sku: 'ABC'),
      );
      expect(result.getLeft().toNullable(), isA<InvalidSaleInputFailure>());
      expect(repo.lastItemParams, isNull);
    });

    test('rejects when zero identifiers are provided', () async {
      final result = await AdicionarItemUseCase(repo)(
        vendaId: 'v1',
        params: const AdicionarItemParams(quantidade: 1),
      );
      expect(result.getLeft().toNullable(), isA<InvalidSaleInputFailure>());
    });

    test('rejects when more than one identifier is provided', () async {
      final result = await AdicionarItemUseCase(repo)(
        vendaId: 'v1',
        params: const AdicionarItemParams(
          quantidade: 1,
          sku: 'ABC',
          codigoBarras: '789',
        ),
      );
      expect(result.getLeft().toNullable(), isA<InvalidSaleInputFailure>());
    });

    test('forwards a valid item', () async {
      final result = await AdicionarItemUseCase(repo)(
        vendaId: 'v1',
        params: const AdicionarItemParams(quantidade: 2, codigoBarras: '789'),
      );
      expect(result.isRight(), isTrue);
      expect(repo.lastItemParams?.quantidade, 2);
    });

    test('propagates SaleAlreadyFinalizedFailure', () async {
      repo.adicionarResult = left(const SaleAlreadyFinalizedFailure());
      final result = await AdicionarItemUseCase(repo)(
        vendaId: 'v1',
        params: const AdicionarItemParams(quantidade: 1, sku: 'ABC'),
      );
      expect(result.getLeft().toNullable(), isA<SaleAlreadyFinalizedFailure>());
    });

    test('propagates InsufficientStockFailure', () async {
      repo.adicionarResult = left(const InsufficientStockFailure());
      final result = await AdicionarItemUseCase(repo)(
        vendaId: 'v1',
        params: const AdicionarItemParams(quantidade: 1, sku: 'ABC'),
      );
      expect(result.getLeft().toNullable(), isA<InsufficientStockFailure>());
    });
  });

  group('RemoverItemUseCase', () {
    test('forwards to the repository', () async {
      final result = await RemoverItemUseCase(repo)(vendaId: 'v1', itemId: 'i1');
      expect(result.isRight(), isTrue);
    });

    test('propagates SaleNotFoundFailure', () async {
      repo.removerResult = left(const SaleNotFoundFailure());
      final result = await RemoverItemUseCase(repo)(vendaId: 'v1', itemId: 'i1');
      expect(result.getLeft().toNullable(), isA<SaleNotFoundFailure>());
    });
  });

  group('AplicarDescontoUseCase', () {
    test('rejects a negative value', () async {
      final result = await AplicarDescontoUseCase(repo)(
        vendaId: 'v1',
        tipo: TipoDesconto.valor,
        valor: -1,
      );
      expect(result.getLeft().toNullable(), isA<InvalidSaleInputFailure>());
      expect(repo.lastDescontoValor, isNull);
    });

    test('rejects a percentage above 100', () async {
      final result = await AplicarDescontoUseCase(repo)(
        vendaId: 'v1',
        tipo: TipoDesconto.percentual,
        valor: 150,
      );
      expect(result.getLeft().toNullable(), isA<InvalidSaleInputFailure>());
    });

    test('rejects an absolute value above the subtotal', () async {
      final result = await AplicarDescontoUseCase(repo)(
        vendaId: 'v1',
        tipo: TipoDesconto.valor,
        valor: 20000,
        subtotalCents: 10000,
      );
      expect(result.getLeft().toNullable(), isA<InvalidSaleInputFailure>());
    });

    test('forwards a valid absolute discount', () async {
      final result = await AplicarDescontoUseCase(repo)(
        vendaId: 'v1',
        tipo: TipoDesconto.valor,
        valor: 500,
        subtotalCents: 10000,
      );
      expect(result.isRight(), isTrue);
      expect(repo.lastDescontoTipo, TipoDesconto.valor);
      expect(repo.lastDescontoValor, 500);
    });
  });

  group('FinalizarVendaUseCase', () {
    test('rejects empty payments', () async {
      final result = await FinalizarVendaUseCase(repo)(
        vendaId: 'v1',
        pagamentos: const [],
      );
      expect(result.getLeft().toNullable(), isA<InvalidSaleInputFailure>());
      expect(repo.lastPagamentos, isNull);
    });

    test('rejects a non-positive payment leg', () async {
      final result = await FinalizarVendaUseCase(repo)(
        vendaId: 'v1',
        pagamentos: const [
          PagamentoInput(forma: FormaPagamento.dinheiro, valorCents: 0),
        ],
      );
      expect(result.getLeft().toNullable(), isA<InvalidSaleInputFailure>());
    });

    test('forwards valid payments', () async {
      final result = await FinalizarVendaUseCase(repo)(
        vendaId: 'v1',
        pagamentos: const [
          PagamentoInput(forma: FormaPagamento.dinheiro, valorCents: 10000),
        ],
      );
      expect(result.isRight(), isTrue);
      expect(repo.lastPagamentos?.length, 1);
    });

    test('propagates PaymentMismatchFailure', () async {
      repo.finalizarResult = left(const PaymentMismatchFailure());
      final result = await FinalizarVendaUseCase(repo)(
        vendaId: 'v1',
        pagamentos: const [
          PagamentoInput(forma: FormaPagamento.pix, valorCents: 5000),
        ],
      );
      expect(result.getLeft().toNullable(), isA<PaymentMismatchFailure>());
    });
  });

  group('CancelarVendaUseCase', () {
    test('forwards to the repository', () async {
      final result = await CancelarVendaUseCase(repo)('v1');
      expect(result.isRight(), isTrue);
    });

    test('propagates SaleAlreadyFinalizedFailure', () async {
      repo.cancelarResult = left(const SaleAlreadyFinalizedFailure());
      final result = await CancelarVendaUseCase(repo)('v1');
      expect(result.getLeft().toNullable(), isA<SaleAlreadyFinalizedFailure>());
    });
  });

  group('BuscarVendaUseCase', () {
    test('returns the sale', () async {
      final result = await BuscarVendaUseCase(repo)('v1');
      expect(result.getRight().toNullable()?.id, 'v1');
    });

    test('propagates SaleNotFoundFailure', () async {
      repo.buscarResult = left(const SaleNotFoundFailure());
      final result = await BuscarVendaUseCase(repo)('x');
      expect(result.getLeft().toNullable(), isA<SaleNotFoundFailure>());
    });
  });

  group('ListarVendasUseCase / ResumoVendasUseCase', () {
    test('listar returns the list', () async {
      final result = await ListarVendasUseCase(repo)();
      expect(result.getRight().toNullable()?.length, 1);
    });

    test('resumo returns totals', () async {
      final result = await ResumoVendasUseCase(repo)();
      expect(result.getRight().toNullable()?.totalCents, 29000);
    });

    test('resumo propagates a network failure', () async {
      repo.resumoResult = left(const VendasNetworkFailure());
      final result = await ResumoVendasUseCase(repo)();
      expect(result.getLeft().toNullable(), isA<VendasNetworkFailure>());
    });
  });
}
