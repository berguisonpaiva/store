import 'package:fpdart/fpdart.dart';

import '../entities/cash_session_status.dart';
import '../entities/movimentacao_caixa_entity.dart';
import '../entities/resumo_sessao_entity.dart';
import '../entities/sessao_caixa_entity.dart';
import '../errors/caixa_failure.dart';

/// Optional filters for listing the operator's own cash sessions.
class SessoesCaixaFiltro {
  const SessoesCaixaFiltro({this.status, this.from, this.to});

  final CashSessionStatus? status;
  final DateTime? from;
  final DateTime? to;
}

/// Cash-session contract owned by the domain. Implemented in `data` against the
/// backend `/caixa/*` endpoints. Business outcomes are returned as
/// `Either<CaixaFailure, T>`. Monetary values are in cents at this boundary.
abstract interface class CaixaRepository {
  /// `POST /caixa/abrir` with `{ valorAbertura }`. `operadorId` is
  /// server-derived and never sent.
  Future<Either<CaixaFailure, SessaoCaixaEntity>> abrir({
    required int valorAberturaCents,
  });

  /// `POST /caixa/:id/fechar` with `{ valorFechamento }`.
  Future<Either<CaixaFailure, SessaoCaixaEntity>> fechar({
    required String sessaoId,
    required int valorFechamentoCents,
  });

  /// `POST /caixa/:id/sangria` with `{ valor, observacao }`.
  Future<Either<CaixaFailure, MovimentacaoCaixaEntity>> registrarSangria({
    required String sessaoId,
    required int valorCents,
    required String observacao,
  });

  /// `POST /caixa/:id/suprimento` with `{ valor, observacao }`.
  Future<Either<CaixaFailure, MovimentacaoCaixaEntity>> registrarSuprimento({
    required String sessaoId,
    required int valorCents,
    required String observacao,
  });

  /// `GET /caixa/aberto` — the operator's open session, or `null` when none.
  Future<Either<CaixaFailure, SessaoCaixaEntity?>> obterCaixaAberto();

  /// `GET /caixa/:id/resumo`.
  Future<Either<CaixaFailure, ResumoSessaoEntity>> obterResumo(String sessaoId);

  /// `GET /caixa/:id/movimentacoes`.
  Future<Either<CaixaFailure, List<MovimentacaoCaixaEntity>>>
  listarMovimentacoes(String sessaoId);

  /// `GET /caixa/minhas` — the operator's own sessions (RN03), newest first.
  Future<Either<CaixaFailure, List<SessaoCaixaEntity>>> listarSessoes(
    SessoesCaixaFiltro filtro,
  );

  /// `GET /caixa/:id` — a single session; the backend denies non-owners (403).
  Future<Either<CaixaFailure, SessaoCaixaEntity>> obterSessao(String sessaoId);
}
