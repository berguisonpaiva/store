import { Variation } from '@repo/catalog'
import { Result } from '@repo/shared'
import { EstoqueError } from '../errors'
import { EstoqueSaldo, MovimentacaoEstoque, MotivoMovimentacaoEstoque, TipoMovimentacao } from '../model'
import { CatalogVariationReader, EstoqueRepository } from '../provider'

interface EstoqueContext {
  saldo: EstoqueSaldo
  variation: Variation | null
}

export abstract class EstoqueUseCaseBase {
  protected constructor(
    protected readonly repository: EstoqueRepository,
    protected readonly catalogVariationReader: CatalogVariationReader,
  ) {}

  protected async loadContext(variacaoId: string): Promise<Result<EstoqueContext>> {
    const currentBalance = await this.repository.findSaldoByVariacaoId(variacaoId)
    if (currentBalance.isFailure) {
      return currentBalance.withFail
    }

    if (currentBalance.instance) {
      return Result.ok({
        saldo: currentBalance.instance,
        variation: null,
      })
    }

    const variation = await this.catalogVariationReader.findById(variacaoId)
    if (variation.isFailure) {
      return variation.withFail
    }
    if (!variation.instance) {
      return Result.fail(EstoqueError.VARIACAO_NAO_ENCONTRADA)
    }

    return Result.ok({
      saldo: EstoqueSaldo.createFromCatalogVariation(variation.instance),
      variation: variation.instance,
    })
  }

  protected async ensureVariationExists(variacaoId: string): Promise<Result<Variation>> {
    const variation = await this.catalogVariationReader.findById(variacaoId)
    if (variation.isFailure) {
      return variation.withFail
    }
    if (!variation.instance) {
      return Result.fail(EstoqueError.VARIACAO_NAO_ENCONTRADA)
    }

    return Result.ok(variation.instance)
  }

  protected async persistMovement(
    saldo: EstoqueSaldo,
    movement: {
      tipo: TipoMovimentacao
      motivo: MotivoMovimentacaoEstoque
      quantidade: number
      usuarioId: string
      origemVendaId?: string
      criadoEm?: Date
      saldoAbsoluto?: boolean
    },
  ): Promise<Result<void>> {
    const ledgerEntry = MovimentacaoEstoque.tryCreate({
      variacaoId: saldo.variacaoId,
      tipo: movement.tipo,
      motivo: movement.motivo,
      quantidade: movement.quantidade,
      saldoAnterior: saldo.saldoAtual,
      origemVendaId: movement.origemVendaId,
      usuarioId: movement.usuarioId,
      criadoEm: movement.criadoEm,
    })
    if (ledgerEntry.isFailure) {
      return ledgerEntry.withFail
    }

    const nextBalance = saldo.cloneWith({
      saldoAtual: ledgerEntry.instance.saldoResultante,
    })
    if (nextBalance.isFailure) {
      return nextBalance.withFail
    }

    return this.repository.aplicarMovimentacao(ledgerEntry.instance, nextBalance.instance, {
      saldoAbsoluto: movement.saldoAbsoluto,
    })
  }
}
