import { PaginatedInputDTO } from '@repo/shared'
import { MovimentacaoCaixa, SessaoCaixa, StatusSessaoCaixa, TipoMovimentacaoCaixa } from '../model'

export type AbrirCaixaInputDTO = {
  operadorId: string
  valorAbertura: number
}

export type RegistrarMovimentacaoInputDTO = {
  sessaoId: string
  /// Acting operator, derived from the authenticated context — must own the session (RN02).
  usuarioId: string
  valor: number
  observacao?: string
}

export type FecharCaixaInputDTO = {
  sessaoId: string
  /// Acting operator, derived from the authenticated context — must own the session (RN02).
  usuarioId: string
  valorFechamento: number
}

export type CaixaAbertoDoOperadorInputDTO = {
  operadorId: string
}

/// Papel do ator que dispara uma leitura. `ADMIN` ignora o read-scope (RN04).
export enum PapelCaixa {
  ADMIN = 'ADMIN',
  OPERADOR = 'OPERADOR',
}

/// Ator autenticado de uma leitura escopada (RN03/RN04): quem pede e com qual papel.
export type CaixaActorDTO = {
  usuarioId: string
  papel: PapelCaixa
}

export type ResumoSessaoInputDTO = {
  sessaoId: string
  /// Ator autenticado; não-ADMIN só lê o próprio caixa (RN03).
  ator: CaixaActorDTO
}

export type ListarMovimentacoesInputDTO = PaginatedInputDTO & {
  sessaoId: string
  /// Ator autenticado; não-ADMIN só lê o próprio caixa (RN03).
  ator: CaixaActorDTO
}

/// Breakdown of concluded-sale totals by payment form (cents), keyed by
/// `FormaPagamento` value. Present in the close resumo (RN05).
export type TotalPorFormaDTO = Record<string, number>

/// Automatic close resumo (RN05): totals computed at `fechar-caixa`.
/// `saldoEsperado = valorAbertura + suprimentos + vendasEmDinheiro − sangrias`.
export type ResumoFechamentoDTO = {
  totalVendas: number
  qtdVendas: number
  totalPorForma: TotalPorFormaDTO
  sangrias: number
  suprimentos: number
  saldoEsperado: number
}

export type FecharCaixaResultDTO = {
  sessaoId: string
  resumo: ResumoFechamentoDTO
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
/// `divergencia` are only present for a `FECHADA` session.
///
/// RN05 fields (`totalVendas`, `qtdVendas`, `totalPorForma`) summarise the
/// concluded sales of the session and feed the automatic close resumo.
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
  totalVendas: number
  qtdVendas: number
  totalPorForma: TotalPorFormaDTO
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
