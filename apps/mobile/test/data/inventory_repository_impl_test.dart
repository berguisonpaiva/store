import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/errors/app_exception.dart';
import 'package:mobile/data/inventory/datasources/inventory_remote_data_source.dart';
import 'package:mobile/data/inventory/dtos/low_stock_item_dto.dart';
import 'package:mobile/data/inventory/dtos/stock_balance_dto.dart';
import 'package:mobile/data/inventory/dtos/stock_movements_page_dto.dart';
import 'package:mobile/data/inventory/repositories/inventory_repository_impl.dart';
import 'package:mobile/domain/inventory/entities/stock_movement_reason.dart';
import 'package:mobile/domain/inventory/entities/stock_movement_type.dart';
import 'package:mobile/domain/inventory/errors/inventory_failure.dart';
import 'package:mocktail/mocktail.dart';

class _MockRemote extends Mock implements InventoryRemoteDataSource {}

void main() {
  late _MockRemote remote;
  late InventoryRepositoryImpl repository;

  setUp(() {
    remote = _MockRemote();
    repository = InventoryRepositoryImpl(remote);
  });

  group('consultarSaldo', () {
    test('maps the balance DTO to an entity', () async {
      when(() => remote.getBalance(any())).thenAnswer(
        (_) async => StockBalanceDto.fromJson(const {
          'variacaoId': 'v1',
          'saldoAtual': 10,
          'estoqueMinimo': 3,
        }),
      );

      final result = await repository.consultarSaldo('v1');

      expect(result.isRight(), isTrue);
      final balance = result.getRight().toNullable()!;
      expect(balance.saldoAtual, 10);
      expect(balance.isBelowMinimum, isFalse);
    });

    test('404 → VariationNotFoundFailure', () async {
      when(() => remote.getBalance(any())).thenThrow(
        const NetworkException('not found', statusCode: 404),
      );

      final result = await repository.consultarSaldo('missing');

      expect(result.getLeft().toNullable(), isA<VariationNotFoundFailure>());
    });
  });

  group('listarMovimentacoes', () {
    test('maps the paginated payload and movement fields', () async {
      when(
        () => remote.listMovements(
          variacaoId: any(named: 'variacaoId'),
          page: any(named: 'page'),
          pageSize: any(named: 'pageSize'),
          from: any(named: 'from'),
          to: any(named: 'to'),
        ),
      ).thenAnswer(
        (_) async => StockMovementsPageDto.fromJson(const {
          'data': [
            {
              'id': 'm1',
              'variacaoId': 'v1',
              'tipo': 'ENTRADA',
              'motivo': 'COMPRA',
              'quantidade': 5,
              'saldoResultante': 15,
              'origemVendaId': null,
              'timestamp': '2026-06-27T12:00:00.000Z',
            },
          ],
          'meta': {'page': 1, 'pageSize': 20, 'total': 1, 'totalPages': 1},
        }),
      );

      final result = await repository.listarMovimentacoes(variacaoId: 'v1');

      final page = result.getRight().toNullable()!;
      expect(page.total, 1);
      expect(page.items.single.tipo, StockMovementType.entrada);
      expect(page.items.single.motivo, StockMovementReason.compra);
    });
  });

  group('registrarSaida', () {
    test('409 → InsufficientStockFailure', () async {
      when(
        () => remote.registerExit(
          variacaoId: any(named: 'variacaoId'),
          quantidade: any(named: 'quantidade'),
          motivo: any(named: 'motivo'),
        ),
      ).thenThrow(const NetworkException('conflict', statusCode: 409));

      final result = await repository.registrarSaida(
        variacaoId: 'v1',
        quantidade: 99,
        motivo: StockMovementReason.perda,
      );

      expect(result.getLeft().toNullable(), isA<InsufficientStockFailure>());
    });
  });

  group('listarAbaixoDoMinimo', () {
    test('maps the list of low-stock items', () async {
      when(() => remote.listLowStock()).thenAnswer(
        (_) async => [
          LowStockItemDto.fromJson(const {
            'variacaoId': 'v1',
            'saldoAtual': 1,
            'estoqueMinimo': 5,
          }),
        ],
      );

      final result = await repository.listarAbaixoDoMinimo();

      expect(result.getRight().toNullable()!.single.estoqueMinimo, 5);
    });
  });
}
