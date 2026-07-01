import { Result, UseCase } from '@repo/shared'
import { RegistrarEntradaInputDTO } from '../dto'
import { EstoqueError } from '../errors'
import { MotivoMovimentacaoEstoque, TipoMovimentacao } from '../model'
import { CatalogVariationReader, EstoqueRepository } from '../provider'
import { EstoqueUseCaseBase } from './estoque-use-case.base'

const ENTRY_REASONS = new Set([
  MotivoMovimentacaoEstoque.COMPRA,
  MotivoMovimentacaoEstoque.DEVOLUCAO,
  MotivoMovimentacaoEstoque.AJUSTE,
])

export class RegistrarEntrada
  extends EstoqueUseCaseBase
  implements UseCase<RegistrarEntradaInputDTO, void>
{
  constructor(repository: EstoqueRepository, catalogVariationReader: CatalogVariationReader) {
    super(repository, catalogVariationReader)
  }

  async execute(input: RegistrarEntradaInputDTO): Promise<Result<void>> {
    if (!ENTRY_REASONS.has(input.motivo)) {
      return Result.fail(EstoqueError.MOTIVO_MOVIMENTACAO_INVALIDO)
    }

    const context = await this.loadContext(input.variacaoId)
    if (context.isFailure) {
      return context.withFail
    }

    return this.persistMovement(context.instance.saldo, {
      tipo: TipoMovimentacao.ENTRADA,
      motivo: input.motivo,
      quantidade: input.quantidade,
      usuarioId: input.usuarioId,
    })
  }
}
