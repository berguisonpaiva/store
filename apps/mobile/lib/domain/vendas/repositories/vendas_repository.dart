import 'package:fpdart/fpdart.dart';

import '../entities/forma_pagamento.dart';
import '../entities/resumo_vendas_entity.dart';
import '../entities/status_venda.dart';
import '../entities/tipo_desconto.dart';
import '../entities/venda_entity.dart';
import '../errors/vendas_failure.dart';

/// Identifies an item to add to a sale: exactly one of the three must be set.
/// The backend resolves it to a catalog variation.
class AdicionarItemParams {
  const AdicionarItemParams({
    required this.quantidade,
    this.variacaoId,
    this.sku,
    this.codigoBarras,
  });

  final int quantidade;
  final String? variacaoId;
  final String? sku;
  final String? codigoBarras;
}

/// A single payment leg sent on finalize.
class PagamentoInput {
  const PagamentoInput({required this.forma, required this.valorCents});

  final FormaPagamento forma;
  final int valorCents;
}

/// Filters for listing/summarizing sales.
class VendasFiltro {
  const VendasFiltro({
    this.status,
    this.sessaoCaixaId,
    this.usuarioId,
    this.startDate,
    this.endDate,
  });

  final StatusVenda? status;
  final String? sessaoCaixaId;
  final String? usuarioId;
  final DateTime? startDate;
  final DateTime? endDate;
}

/// Sales contract owned by the domain. Implemented in `data` against the backend
/// `/vendas` endpoints. Business outcomes are returned as
/// `Either<VendasFailure, T>`. Monetary values are in cents at this boundary.
abstract interface class VendasRepository {
  /// `POST /vendas` — opens a new sale for the operator's open session.
  Future<Either<VendasFailure, VendaEntity>> criar();

  /// `POST /vendas/:id/itens`.
  Future<Either<VendasFailure, VendaEntity>> adicionarItem({
    required String vendaId,
    required AdicionarItemParams params,
  });

  /// `DELETE /vendas/:id/itens/:itemId`.
  Future<Either<VendasFailure, VendaEntity>> removerItem({
    required String vendaId,
    required String itemId,
  });

  /// `PATCH /vendas/:id/desconto`.
  Future<Either<VendasFailure, VendaEntity>> aplicarDesconto({
    required String vendaId,
    required TipoDesconto tipo,
    required num valor,
  });

  /// `POST /vendas/:id/finalizar`.
  Future<Either<VendasFailure, VendaEntity>> finalizar({
    required String vendaId,
    required List<PagamentoInput> pagamentos,
  });

  /// `POST /vendas/:id/cancelar`.
  Future<Either<VendasFailure, VendaEntity>> cancelar(String vendaId);

  /// `GET /vendas/:id`.
  Future<Either<VendasFailure, VendaEntity>> buscar(String vendaId);

  /// `GET /vendas` (filters).
  Future<Either<VendasFailure, List<VendaEntity>>> listar(VendasFiltro filtro);

  /// `GET /vendas/resumo` (filters).
  Future<Either<VendasFailure, ResumoVendasEntity>> resumo(
    VendasFiltro filtro,
  );
}
