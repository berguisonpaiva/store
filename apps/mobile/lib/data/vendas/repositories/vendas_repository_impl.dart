import 'package:fpdart/fpdart.dart';

import '../../../core/errors/app_exception.dart';
import '../../../domain/vendas/entities/resumo_vendas_entity.dart';
import '../../../domain/vendas/entities/tipo_desconto.dart';
import '../../../domain/vendas/entities/venda_entity.dart';
import '../../../domain/vendas/errors/vendas_failure.dart';
import '../../../domain/vendas/repositories/vendas_repository.dart';
import '../../caixa/dtos/cash_money.dart';
import '../datasources/sale_exception.dart';
import '../datasources/vendas_remote_data_source.dart';

/// Default [VendasRepository]. Delegates to the remote data source and converts
/// technical exceptions at the boundary into domain [VendasFailure]s, mapping the
/// backend's stable error code to the matching failure.
class VendasRepositoryImpl implements VendasRepository {
  const VendasRepositoryImpl(this._remote);

  final VendasRemoteDataSource _remote;

  @override
  Future<Either<VendasFailure, VendaEntity>> criar() =>
      _guard(() async => (await _remote.criar()).toEntity());

  @override
  Future<Either<VendasFailure, VendaEntity>> adicionarItem({
    required String vendaId,
    required AdicionarItemParams params,
  }) => _guard(() async {
    final dto = await _remote.adicionarItem(
      vendaId: vendaId,
      variacaoId: params.variacaoId,
      sku: params.sku,
      codigoBarras: params.codigoBarras,
      quantidade: params.quantidade,
    );
    return dto.toEntity();
  });

  @override
  Future<Either<VendasFailure, VendaEntity>> removerItem({
    required String vendaId,
    required String itemId,
  }) => _guard(() async {
    final dto = await _remote.removerItem(vendaId: vendaId, itemId: itemId);
    return dto.toEntity();
  });

  @override
  Future<Either<VendasFailure, VendaEntity>> aplicarDesconto({
    required String vendaId,
    required TipoDesconto tipo,
    required num valor,
  }) => _guard(() async {
    // `valor` discounts are passed in cents internally and sent as reais; a
    // `percentual` discount is a raw 0..100 value with no unit conversion.
    final wireValor = tipo == TipoDesconto.valor
        ? CashMoney.centsToReais(valor.round())
        : valor;
    final dto = await _remote.aplicarDesconto(
      vendaId: vendaId,
      tipo: tipo.wire,
      valor: wireValor,
    );
    return dto.toEntity();
  });

  @override
  Future<Either<VendasFailure, VendaEntity>> finalizar({
    required String vendaId,
    required List<PagamentoInput> pagamentos,
  }) => _guard(() async {
    final dto = await _remote.finalizar(
      vendaId: vendaId,
      pagamentos: pagamentos
          .map(
            (p) => {
              'forma': p.forma.wire,
              'valor': CashMoney.centsToReais(p.valorCents),
            },
          )
          .toList(),
    );
    return dto.toEntity();
  });

  @override
  Future<Either<VendasFailure, VendaEntity>> cancelar(String vendaId) =>
      _guard(() async => (await _remote.cancelar(vendaId)).toEntity());

  @override
  Future<Either<VendasFailure, VendaEntity>> buscar(String vendaId) =>
      _guard(() async => (await _remote.buscar(vendaId)).toEntity());

  @override
  Future<Either<VendasFailure, List<VendaEntity>>> listar(
    VendasFiltro filtro,
  ) => _guard(() async {
    final dtos = await _remote.listar(_queryFrom(filtro));
    return dtos.map((e) => e.toEntity()).toList();
  });

  @override
  Future<Either<VendasFailure, ResumoVendasEntity>> resumo(
    VendasFiltro filtro,
  ) => _guard(() async {
    final dto = await _remote.resumo(_queryFrom(filtro));
    return dto.toEntity();
  });

  Map<String, dynamic> _queryFrom(VendasFiltro filtro) {
    final query = <String, dynamic>{};
    if (filtro.status != null) query['status'] = filtro.status!.wire;
    if (filtro.sessaoCaixaId != null) {
      query['sessaoCaixaId'] = filtro.sessaoCaixaId;
    }
    if (filtro.usuarioId != null) query['usuarioId'] = filtro.usuarioId;
    if (filtro.startDate != null) {
      query['startDate'] = filtro.startDate!.toUtc().toIso8601String();
    }
    if (filtro.endDate != null) {
      query['endDate'] = filtro.endDate!.toUtc().toIso8601String();
    }
    return query;
  }

  /// Runs [run], converting any sale/technical exception into a failure.
  Future<Either<VendasFailure, T>> _guard<T>(Future<T> Function() run) async {
    try {
      return right(await run());
    } on SaleException catch (e) {
      return left(_toFailure(e));
    } on AppException {
      return left(const VendasNetworkFailure());
    }
  }

  VendasFailure _toFailure(SaleException e) {
    return switch (e.code) {
      'SALE_NOT_FOUND' => const SaleNotFoundFailure(),
      'SALE_ALREADY_FINALIZED' => const SaleAlreadyFinalizedFailure(),
      'NO_OPEN_CASH_SESSION' => const NoOpenCashSessionFailure(),
      'INSUFFICIENT_STOCK' => const InsufficientStockFailure(),
      'PAYMENT_MISMATCH' => const PaymentMismatchFailure(),
      _ => _fallbackByStatus(e.statusCode),
    };
  }

  VendasFailure _fallbackByStatus(int? status) => switch (status) {
    404 => const SaleNotFoundFailure(),
    409 => const SaleAlreadyFinalizedFailure(),
    _ => const VendasNetworkFailure(),
  };
}
