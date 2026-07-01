import 'package:fpdart/fpdart.dart';

import '../entities/movimentacao_caixa_entity.dart';
import '../entities/resumo_sessao_entity.dart';
import '../entities/sessao_caixa_entity.dart';
import '../errors/caixa_failure.dart';

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
}
