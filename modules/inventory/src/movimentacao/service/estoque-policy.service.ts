import { Result } from '@repo/shared'
import { EstoqueError } from '../errors'
import { QuantidadeMovimentada } from '../model/quantidade-movimentada.vo'
import { Saldo } from '../model/saldo.vo'
import { TipoMovimentacao } from '../model/tipo-movimentacao'

export interface AjusteSaldoCalculado {
  tipo: TipoMovimentacao
  quantidade: number
}

export class EstoquePolicyService {
  static assertSaldoSuficiente(saldoAtual: number, quantidade: number): Result<void> {
    const validQuantity = QuantidadeMovimentada.tryCreate(quantidade)
    if (validQuantity.isFailure) {
      return validQuantity.withFail
    }

    if (saldoAtual < validQuantity.instance.value) {
      return Result.fail(EstoqueError.ESTOQUE_INSUFICIENTE)
    }

    return Result.ok()
  }

  static calculateAdjustment(saldoAtual: number, novoSaldo: number): Result<AjusteSaldoCalculado> {
    const validTargetBalance = Saldo.tryCreate(novoSaldo)
    if (validTargetBalance.isFailure) {
      return Result.fail(EstoqueError.QUANTIDADE_INVALIDA)
    }

    if (validTargetBalance.instance.value === saldoAtual) {
      return Result.ok({
        tipo: TipoMovimentacao.ENTRADA,
        quantidade: 0,
      })
    }

    const delta = Math.abs(validTargetBalance.instance.value - saldoAtual)
    const validQuantity = QuantidadeMovimentada.tryCreate(delta)
    if (validQuantity.isFailure) {
      return validQuantity.withFail
    }

    return Result.ok({
      tipo: validTargetBalance.instance.value > saldoAtual ? TipoMovimentacao.ENTRADA : TipoMovimentacao.SAIDA,
      quantidade: validQuantity.instance.value,
    })
  }
}
