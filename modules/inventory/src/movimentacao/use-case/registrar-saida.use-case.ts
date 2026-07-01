import { Result, UseCase } from '@repo/shared'
import { RegistrarSaidaInputDTO } from '../dto'
import { EstoqueError } from '../errors'
import { EstoquePolicyService } from '../service'
import { CatalogVariationReader, EstoqueRepository } from '../provider'
import { MotivoMovimentacaoEstoque, TipoMovimentacao } from '../model'
import { EstoqueUseCaseBase } from './estoque-use-case.base'

const EXIT_REASONS = new Set([MotivoMovimentacaoEstoque.PERDA, MotivoMovimentacaoEstoque.AJUSTE])

export class RegistrarSaida
  extends EstoqueUseCaseBase
  implements UseCase<RegistrarSaidaInputDTO, void>
{
  constructor(repository: EstoqueRepository, catalogVariationReader: CatalogVariationReader) {
    super(repository, catalogVariationReader)
  }

  async execute(input: RegistrarSaidaInputDTO): Promise<Result<void>> {
    if (!EXIT_REASONS.has(input.motivo)) {
      return Result.fail(EstoqueError.MOTIVO_MOVIMENTACAO_INVALIDO)
    }

    const context = await this.loadContext(input.variacaoId)
    if (context.isFailure) {
      return context.withFail
    }

    const sufficientBalance = EstoquePolicyService.assertSaldoSuficiente(
      context.instance.saldo.saldoAtual,
      input.quantidade,
    )
    if (sufficientBalance.isFailure) {
      return sufficientBalance.withFail
    }

    return this.persistMovement(context.instance.saldo, {
      tipo: TipoMovimentacao.SAIDA,
      motivo: input.motivo,
      quantidade: input.quantidade,
      usuarioId: input.usuarioId,
    })
  }
}
