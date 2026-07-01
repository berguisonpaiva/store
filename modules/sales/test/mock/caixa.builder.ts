import { SessaoCaixa } from '../../src/cash-session'

export const OPERADOR_A = '11111111-1111-1111-1111-111111111111'
export const OPERADOR_B = '22222222-2222-2222-2222-222222222222'
export const ADMIN_ID = '33333333-3333-3333-3333-333333333333'
export const SESSAO_ID = '44444444-4444-4444-4444-444444444444'

interface BuildSessaoOptions {
  id?: string
  operadorId?: string
  valorAbertura?: number
  fechada?: boolean
  valorFechamento?: number
}

/// Builds a `SessaoCaixa` for cash-session tests. `fechada` closes it so RN06
/// immutability paths can be exercised.
export function buildSessao(options: BuildSessaoOptions = {}): SessaoCaixa {
  const aberta = SessaoCaixa.abrir({
    id: options.id ?? SESSAO_ID,
    operadorId: options.operadorId ?? OPERADOR_A,
    valorAbertura: options.valorAbertura ?? 10000,
  })
  if (aberta.isFailure) {
    throw new Error(`buildSessao: ${aberta.errors.join(',')}`)
  }
  if (!options.fechada) {
    return aberta.instance
  }
  const fechada = aberta.instance.fechar(options.valorFechamento ?? 10000)
  if (fechada.isFailure) {
    throw new Error(`buildSessao(fechada): ${fechada.errors.join(',')}`)
  }
  return fechada.instance
}
