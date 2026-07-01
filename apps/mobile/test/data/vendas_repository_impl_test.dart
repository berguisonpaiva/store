import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/errors/app_exception.dart';
import 'package:mobile/data/vendas/datasources/sale_exception.dart';
import 'package:mobile/data/vendas/datasources/vendas_remote_data_source.dart';
import 'package:mobile/data/vendas/dtos/resumo_vendas_dto.dart';
import 'package:mobile/data/vendas/dtos/venda_dto.dart';
import 'package:mobile/data/vendas/repositories/vendas_repository_impl.dart';
import 'package:mobile/domain/vendas/entities/forma_pagamento.dart';
import 'package:mobile/domain/vendas/entities/status_venda.dart';
import 'package:mobile/domain/vendas/entities/tipo_desconto.dart';
import 'package:mobile/domain/vendas/errors/vendas_failure.dart';
import 'package:mobile/domain/vendas/repositories/vendas_repository.dart';
import 'package:mocktail/mocktail.dart';

class _MockRemote extends Mock implements VendasRemoteDataSource {}

const _vendaJson = {
  'id': 'v1',
  'numero': 42,
  'canal': 'PDV',
  'status': 'ABERTA',
  'usuarioId': 'u1',
  'sessaoCaixaId': 's1',
  // Money is reais (number) on the wire.
  'subtotal': 100.0,
  'desconto': 5.0,
  'total': 95.0,
  'itens': [
    {
      'id': 'i1',
      'variacaoId': 'var1',
      'quantidade': 2,
      'precoUnitario': 50.0,
      'total': 100.0,
    },
  ],
  'pagamentos': [
    {'id': 'p1', 'forma': 'DINHEIRO', 'valor': 95.0},
  ],
};

void main() {
  late _MockRemote remote;
  late VendasRepositoryImpl repository;

  setUp(() {
    remote = _MockRemote();
    repository = VendasRepositoryImpl(remote);
  });

  group('DTO ↔ entity mapping (reais wire → cents internally)', () {
    test('venda DTO maps reais to integer cents and parses enums', () async {
      when(() => remote.criar())
          .thenAnswer((_) async => VendaDto.fromJson(_vendaJson));

      final result = await repository.criar();
      final venda = result.getRight().toNullable()!;
      expect(venda.id, 'v1');
      expect(venda.numero, 42);
      expect(venda.status, StatusVenda.aberta);
      expect(venda.subtotalCents, 10000);
      expect(venda.descontoCents, 500);
      expect(venda.totalCents, 9500);
      expect(venda.itens.single.precoUnitarioCents, 5000);
      expect(venda.itens.single.totalCents, 10000);
      expect(venda.pagamentos.single.forma, FormaPagamento.dinheiro);
      expect(venda.pagamentos.single.valorCents, 9500);
    });

    test('maps fractional reais to cents without drift', () async {
      when(() => remote.criar()).thenAnswer(
        (_) async => VendaDto.fromJson({
          ..._vendaJson,
          'subtotal': 19.99,
          'desconto': 0.0,
          'total': 19.99,
          'itens': [
            {
              'id': 'i1',
              'variacaoId': 'var1',
              'quantidade': 1,
              'precoUnitario': 19.99,
              'total': 19.99,
            },
          ],
          'pagamentos': const <Map<String, dynamic>>[],
        }),
      );

      final venda = (await repository.criar()).getRight().toNullable()!;
      expect(venda.totalCents, 1999);
      expect(venda.itens.single.precoUnitarioCents, 1999);
    });

    test('venda DTO toJson round-trips items, payments and totals', () {
      final dto = VendaDto.fromJson(_vendaJson);
      final roundTripped = VendaDto.fromJson(dto.toJson());
      final entity = roundTripped.toEntity();
      expect(entity.subtotalCents, 10000);
      expect(entity.descontoCents, 500);
      expect(entity.totalCents, 9500);
      expect(entity.itens.length, 1);
      expect(entity.pagamentos.length, 1);
      expect(entity.itens.single.variacaoId, 'var1');
      expect(entity.pagamentos.single.valorCents, 9500);
    });

    test('resumo DTO maps reais fields to cents', () async {
      when(() => remote.resumo(any())).thenAnswer(
        (_) async => ResumoVendasDto.fromJson(const {
          'quantidade': 3,
          'subtotal': 300.0,
          'desconto': 10.0,
          'total': 290.0,
        }),
      );

      final result = await repository.resumo(const VendasFiltro());
      final resumo = result.getRight().toNullable()!;
      expect(resumo.quantidade, 3);
      expect(resumo.subtotalCents, 30000);
      expect(resumo.descontoCents, 1000);
      expect(resumo.totalCents, 29000);
    });
  });

  group('request shaping', () {
    test('aplicarDesconto sends a percentual tipo with the raw value', () async {
      when(
        () => remote.aplicarDesconto(
          vendaId: any(named: 'vendaId'),
          tipo: any(named: 'tipo'),
          valor: any(named: 'valor'),
        ),
      ).thenAnswer((_) async => VendaDto.fromJson(_vendaJson));

      await repository.aplicarDesconto(
        vendaId: 'v1',
        tipo: TipoDesconto.percentual,
        valor: 10,
      );
      verify(
        () => remote.aplicarDesconto(
          vendaId: 'v1',
          tipo: 'percentual',
          valor: 10,
        ),
      ).called(1);
    });

    test('aplicarDesconto converts a valor discount from cents to reais',
        () async {
      when(
        () => remote.aplicarDesconto(
          vendaId: any(named: 'vendaId'),
          tipo: any(named: 'tipo'),
          valor: any(named: 'valor'),
        ),
      ).thenAnswer((_) async => VendaDto.fromJson(_vendaJson));

      await repository.aplicarDesconto(
        vendaId: 'v1',
        tipo: TipoDesconto.valor,
        valor: 500, // cents internally → 5.0 reais on the wire
      );
      verify(
        () => remote.aplicarDesconto(
          vendaId: 'v1',
          tipo: 'valor',
          valor: 5.0,
        ),
      ).called(1);
    });

    test('finalizar maps payments to wire forma + reais valor', () async {
      List<Map<String, dynamic>>? captured;
      when(
        () => remote.finalizar(
          vendaId: any(named: 'vendaId'),
          pagamentos: any(named: 'pagamentos'),
        ),
      ).thenAnswer((invocation) async {
        captured = invocation.namedArguments[#pagamentos]
            as List<Map<String, dynamic>>;
        return VendaDto.fromJson(_vendaJson);
      });

      await repository.finalizar(
        vendaId: 'v1',
        pagamentos: const [
          PagamentoInput(forma: FormaPagamento.pix, valorCents: 9500),
        ],
      );
      expect(captured, [
        {'forma': 'PIX', 'valor': 95.0},
      ]);
    });
  });

  group('error code → Failure', () {
    test('SALE_NOT_FOUND → SaleNotFoundFailure', () async {
      when(() => remote.buscar(any())).thenThrow(
        const SaleException('missing', code: 'SALE_NOT_FOUND', statusCode: 404),
      );
      final result = await repository.buscar('x');
      expect(result.getLeft().toNullable(), isA<SaleNotFoundFailure>());
    });

    test('SALE_ALREADY_FINALIZED → SaleAlreadyFinalizedFailure', () async {
      when(() => remote.cancelar(any())).thenThrow(
        const SaleException(
          'conflict',
          code: 'SALE_ALREADY_FINALIZED',
          statusCode: 409,
        ),
      );
      final result = await repository.cancelar('v1');
      expect(
        result.getLeft().toNullable(),
        isA<SaleAlreadyFinalizedFailure>(),
      );
    });

    test('NO_OPEN_CASH_SESSION → NoOpenCashSessionFailure', () async {
      when(() => remote.criar()).thenThrow(
        const SaleException(
          'no session',
          code: 'NO_OPEN_CASH_SESSION',
          statusCode: 422,
        ),
      );
      final result = await repository.criar();
      expect(result.getLeft().toNullable(), isA<NoOpenCashSessionFailure>());
    });

    test('INSUFFICIENT_STOCK → InsufficientStockFailure', () async {
      when(
        () => remote.finalizar(
          vendaId: any(named: 'vendaId'),
          pagamentos: any(named: 'pagamentos'),
        ),
      ).thenThrow(
        const SaleException(
          'stock',
          code: 'INSUFFICIENT_STOCK',
          statusCode: 422,
        ),
      );
      final result = await repository.finalizar(
        vendaId: 'v1',
        pagamentos: const [
          PagamentoInput(forma: FormaPagamento.dinheiro, valorCents: 100),
        ],
      );
      expect(result.getLeft().toNullable(), isA<InsufficientStockFailure>());
    });

    test('PAYMENT_MISMATCH (422) → PaymentMismatchFailure', () async {
      when(
        () => remote.finalizar(
          vendaId: any(named: 'vendaId'),
          pagamentos: any(named: 'pagamentos'),
        ),
      ).thenThrow(
        const SaleException(
          'mismatch',
          code: 'PAYMENT_MISMATCH',
          statusCode: 422,
        ),
      );
      final result = await repository.finalizar(
        vendaId: 'v1',
        pagamentos: const [
          PagamentoInput(forma: FormaPagamento.dinheiro, valorCents: 100),
        ],
      );
      expect(result.getLeft().toNullable(), isA<PaymentMismatchFailure>());
    });

    test('unknown 404 without code → SaleNotFoundFailure', () async {
      when(() => remote.buscar(any()))
          .thenThrow(const SaleException('missing', statusCode: 404));
      final result = await repository.buscar('x');
      expect(result.getLeft().toNullable(), isA<SaleNotFoundFailure>());
    });

    test('a generic AppException → VendasNetworkFailure', () async {
      when(() => remote.buscar(any()))
          .thenThrow(const SerializationException('bad payload'));
      final result = await repository.buscar('x');
      expect(result.getLeft().toNullable(), isA<VendasNetworkFailure>());
    });
  });
}
