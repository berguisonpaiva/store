import { PaginatedResultDTO, Result } from '@repo/shared'
import {
  CaixaQuery,
  ListarMovimentacoesInputDTO,
  MovimentacaoCaixaDTO,
  ResumoSessaoDTO,
  SessaoCaixaDTO,
} from '../../src/cash-session'

/// In-memory `CaixaQuery` for cash-session read use-case tests. Serves canned
/// projections keyed by session id.
export class InMemoryCaixaQuery implements CaixaQuery {
  readonly sessoesAbertas = new Map<string, SessaoCaixaDTO>()
  readonly resumos = new Map<string, ResumoSessaoDTO>()
  readonly movimentacoes = new Map<string, MovimentacaoCaixaDTO[]>()

  async caixaAbertoDoOperador(operadorId: string): Promise<Result<SessaoCaixaDTO | null>> {
    return Result.ok(this.sessoesAbertas.get(operadorId) ?? null)
  }

  async resumoSessao(sessaoId: string): Promise<Result<ResumoSessaoDTO | null>> {
    return Result.ok(this.resumos.get(sessaoId) ?? null)
  }

  async listarMovimentacoes(
    input: ListarMovimentacoesInputDTO,
  ): Promise<Result<PaginatedResultDTO<MovimentacaoCaixaDTO>>> {
    const data = this.movimentacoes.get(input.sessaoId) ?? []
    return Result.ok({
      data,
      meta: { page: input.page, pageSize: input.pageSize, total: data.length, totalPages: 1 },
    })
  }
}
