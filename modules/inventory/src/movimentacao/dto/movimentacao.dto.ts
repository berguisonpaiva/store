import { PaginatedInputDTO } from '@repo/shared'
import { MotivoMovimentacaoEstoque, MovimentacaoEstoque, TipoMovimentacao } from '../model'
import { EstoqueSaldo } from '../model/estoque-saldo.entity'

export type RegistrarEntradaInputDTO = {
  variacaoId: string
  quantidade: number
  motivo: MotivoMovimentacaoEstoque
  usuarioId: string
}

export type RegistrarSaidaInputDTO = {
  variacaoId: string
  quantidade: number
  motivo: MotivoMovimentacaoEstoque
  usuarioId: string
}

export type AjustarSaldoInputDTO = {
  variacaoId: string
  novoSaldo: number
  observacao?: string
  usuarioId: string
}

export type ConsultarSaldoInputDTO = {
  variacaoId: string
}

export type ListarMovimentacoesInputDTO = PaginatedInputDTO & {
  variacaoId: string
  startDate?: Date
  endDate?: Date
}

export type ListarAbaixoDoMinimoInputDTO = Record<string, never>

export type SaldoEstoqueDTO = {
  variacaoId: string
  saldoAtual: number
  estoqueMinimo: number
}

export type MovimentacaoEstoqueDTO = {
  id: string
  variacaoId: string
  tipo: TipoMovimentacao
  motivo: MotivoMovimentacaoEstoque
  quantidade: number
  saldoResultante: number
  origemVendaId: string | null
  usuarioId: string
  timestamp: Date
}

export type ItemAbaixoDoMinimoDTO = {
  variacaoId: string
  saldoAtual: number
  estoqueMinimo: number
}

export function toSaldoEstoqueDTO(saldo: EstoqueSaldo): SaldoEstoqueDTO {
  return {
    variacaoId: saldo.variacaoId,
    saldoAtual: saldo.saldoAtual,
    estoqueMinimo: saldo.estoqueMinimo,
  }
}

export function toMovimentacaoEstoqueDTO(movimentacao: MovimentacaoEstoque): MovimentacaoEstoqueDTO {
  return {
    id: movimentacao.id,
    variacaoId: movimentacao.variacaoId,
    tipo: movimentacao.tipo,
    motivo: movimentacao.motivo,
    quantidade: movimentacao.quantidade,
    saldoResultante: movimentacao.saldoResultante,
    origemVendaId: movimentacao.origemVendaId,
    usuarioId: movimentacao.usuarioId,
    timestamp: movimentacao.criadoEm,
  }
}
