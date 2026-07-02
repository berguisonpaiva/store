import { Result, TransactionContext } from '@repo/shared'
import { MovimentacaoCaixa, SessaoCaixa } from '../model'

/// Write-side persistence contract for the cash aggregate. Framework-free.
export interface CaixaRepository {
  /// Returns the operator's `ABERTA` session, or `null` when none is open.
  findSessaoAbertaByOperador(operadorId: string): Promise<Result<SessaoCaixa | null>>
  /// Returns a session by id, or `null` when it does not exist.
  findSessaoById(sessaoId: string): Promise<Result<SessaoCaixa | null>>
  /// Persists a newly opened session together with its automatic `ABERTURA`
  /// movement (RN01) in a single transaction.
  abrirSessao(
    sessao: SessaoCaixa,
    movimentacaoAbertura: MovimentacaoCaixa,
  ): Promise<Result<SessaoCaixa>>
  /// Persists the closed session state transactionally.
  fecharSessao(sessao: SessaoCaixa): Promise<Result<SessaoCaixa>>
  /// Records a movement against its session in a single transaction. Accepts an
  /// optional `tx` so a sale-driven `VENDA` movement joins the sale's transaction (RN09).
  registrarMovimentacao(
    movimentacao: MovimentacaoCaixa,
    tx?: TransactionContext,
  ): Promise<Result<MovimentacaoCaixa>>
  /// Reverses a prior `VENDA` movement of `valor` (cents) against the session, inside
  /// the passed transactional context. Used on cancel and on finalize rollback.
  estornarVenda(sessaoId: string, valor: number, tx?: TransactionContext): Promise<Result<void>>
}
