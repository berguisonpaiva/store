import '../dtos/movimentacao_caixa_dto.dart';
import '../dtos/resumo_sessao_dto.dart';
import '../dtos/sessao_caixa_dto.dart';

/// Remote calls against the backend `/caixa/*` endpoints. Amounts are sent in
/// reais. Throws technical exceptions ([CashSessionException] carrying the
/// backend code, or `AppException`); the repository converts them to failures.
abstract interface class CaixaRemoteDataSource {
  Future<SessaoCaixaDto> abrir({required double valorAbertura});

  Future<SessaoCaixaDto> fechar({
    required String sessaoId,
    required double valorFechamento,
  });

  Future<MovimentacaoCaixaDto> sangria({
    required String sessaoId,
    required double valor,
    required String observacao,
  });

  Future<MovimentacaoCaixaDto> suprimento({
    required String sessaoId,
    required double valor,
    required String observacao,
  });

  /// Returns the open session, or `null` when the endpoint reports none.
  Future<SessaoCaixaDto?> getAberto();

  Future<ResumoSessaoDto> getResumo(String sessaoId);

  Future<List<MovimentacaoCaixaDto>> listMovimentacoes(String sessaoId);
}
