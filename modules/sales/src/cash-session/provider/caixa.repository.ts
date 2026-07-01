import { Result } from '@repo/shared'
import { MovimentacaoCaixa, SessaoCaixa } from '../model'

/// Write-side persistence contract for the cash aggregate. Framework-free.
export interface CaixaRepository {
  /// Returns the operator's `ABERTO` session, or `null` when none is open.
  findSessaoAbertaByOperador(operadorId: string): Promise<Result<SessaoCaixa | null>>
  /// Returns a session by id, or `null` when it does not exist.
  findSessaoById(sessaoId: string): Promise<Result<SessaoCaixa | null>>
  /// Persists a newly opened session.
  abrirSessao(sessao: SessaoCaixa): Promise<Result<SessaoCaixa>>
  /// Persists the closed session state transactionally.
  fecharSessao(sessao: SessaoCaixa): Promise<Result<SessaoCaixa>>
  /// Records a movement against its session in a single transaction.
  registrarMovimentacao(movimentacao: MovimentacaoCaixa): Promise<Result<MovimentacaoCaixa>>
}
