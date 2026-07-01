import { Result, UseCase } from '@repo/shared'
import { AjustarSaldoInputDTO } from '../dto'
import { MotivoMovimentacaoEstoque } from '../model'
import { CatalogVariationReader, EstoqueRepository } from '../provider'
import { EstoquePolicyService } from '../service'
import { EstoqueUseCaseBase } from './estoque-use-case.base'

export class AjustarSaldo extends EstoqueUseCaseBase implements UseCase<AjustarSaldoInputDTO, void> {
  constructor(repository: EstoqueRepository, catalogVariationReader: CatalogVariationReader) {
    super(repository, catalogVariationReader)
  }

  async execute(input: AjustarSaldoInputDTO): Promise<Result<void>> {
    const context = await this.loadContext(input.variacaoId)
    if (context.isFailure) {
      return context.withFail
    }

    const adjustment = EstoquePolicyService.calculateAdjustment(
      context.instance.saldo.saldoAtual,
      input.novoSaldo,
    )
    if (adjustment.isFailure) {
      return adjustment.withFail
    }

    if (adjustment.instance.quantidade === 0) {
      return Result.ok()
    }

    return this.persistMovement(context.instance.saldo, {
      tipo: adjustment.instance.tipo,
      motivo: MotivoMovimentacaoEstoque.AJUSTE,
      quantidade: adjustment.instance.quantidade,
      usuarioId: input.usuarioId,
      saldoAbsoluto: true,
    })
  }
}
