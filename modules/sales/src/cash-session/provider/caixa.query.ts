import { PaginatedResultDTO, Result } from '@repo/shared'
import {
  ListarMovimentacoesInputDTO,
  MovimentacaoCaixaDTO,
  ResumoSessaoDTO,
  SessaoCaixaDTO,
} from '../dto'

/// Read-side projection contract for the cash aggregate (CQRS-lite). Framework-free.
export interface CaixaQuery {
  /// The operator's current `ABERTO` session, or `null` when none is open.
  caixaAbertoDoOperador(operadorId: string): Promise<Result<SessaoCaixaDTO | null>>
  /// Aggregated cash totals for the session, or `null` when it does not exist.
  resumoSessao(sessaoId: string): Promise<Result<ResumoSessaoDTO | null>>
  /// Paginated movements of a session.
  listarMovimentacoes(
    input: ListarMovimentacoesInputDTO,
  ): Promise<Result<PaginatedResultDTO<MovimentacaoCaixaDTO>>>
}
