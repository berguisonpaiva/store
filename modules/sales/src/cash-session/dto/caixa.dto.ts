import { PaginatedInputDTO } from '@repo/shared'
import { MovimentacaoCaixa, SessaoCaixa, StatusSessaoCaixa, TipoMovimentacaoCaixa } from '../model'

export type AbrirCaixaInputDTO = {
  operadorId: string
  valorAbertura: number
}

export type RegistrarMovimentacaoInputDTO = {
  sessaoId: string
  valor: number
  observacao?: string
}

export type FecharCaixaInputDTO = {
  sessaoId: string
  valorFechamento: number
}

export type CaixaAbertoDoOperadorInputDTO = {
  operadorId: string
}

export type ResumoSessaoInputDTO = {
  sessaoId: string
}

export type ListarMovimentacoesInputDTO = PaginatedInputDTO & {
  sessaoId: string
}

export type FecharCaixaResultDTO = {
  sessaoId: string
  esperado: number
  contado: number
  divergencia: number
}

export type SessaoCaixaDTO = {
  id: string
  operadorId: string
  status: StatusSessaoCaixa
  valorAbertura: number
  valorFechamento: number | null
  abertaEm: Date
  fechadaEm: Date | null
}

export type MovimentacaoCaixaDTO = {
  id: string
  sessaoId: string
  tipo: TipoMovimentacaoCaixa
  valor: number
  observacao: string | null
  timestamp: Date
}

/// Aggregated cash totals of a session (all values in cents). `contado` and
/// `divergencia` are only present for a `FECHADO` session.
export type ResumoSessaoDTO = {
  sessaoId: string
  status: StatusSessaoCaixa
  abertura: number
  suprimentos: number
  vendasDinheiro: number
  sangrias: number
  esperado: number
  contado: number | null
  divergencia: number | null
}

export function toSessaoCaixaDTO(sessao: SessaoCaixa): SessaoCaixaDTO {
  return {
    id: sessao.id,
    operadorId: sessao.operadorId,
    status: sessao.status,
    valorAbertura: sessao.valorAbertura,
    valorFechamento: sessao.valorFechamento,
    abertaEm: sessao.abertaEm,
    fechadaEm: sessao.fechadaEm,
  }
}

export function toMovimentacaoCaixaDTO(movimentacao: MovimentacaoCaixa): MovimentacaoCaixaDTO {
  return {
    id: movimentacao.id,
    sessaoId: movimentacao.sessaoId,
    tipo: movimentacao.tipo,
    valor: movimentacao.valor,
    observacao: movimentacao.observacao,
    timestamp: movimentacao.criadaEm,
  }
}
