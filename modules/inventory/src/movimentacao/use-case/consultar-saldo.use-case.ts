import { Result, UseCase } from '@repo/shared'
import { ConsultarSaldoInputDTO, SaldoEstoqueDTO } from '../dto'
import { EstoqueError } from '../errors'
import { CatalogVariationReader, EstoqueQuery } from '../provider'

export class ConsultarSaldo implements UseCase<ConsultarSaldoInputDTO, SaldoEstoqueDTO> {
  constructor(
    private readonly estoqueQuery: EstoqueQuery,
    private readonly catalogVariationReader: CatalogVariationReader,
  ) {}

  async execute(input: ConsultarSaldoInputDTO): Promise<Result<SaldoEstoqueDTO>> {
    const queryResult = await this.estoqueQuery.consultarSaldo(input.variacaoId)
    if (queryResult.isFailure) {
      return queryResult.withFail
    }

    if (queryResult.instance) {
      return Result.ok(queryResult.instance)
    }

    const variation = await this.catalogVariationReader.findById(input.variacaoId)
    if (variation.isFailure) {
      return variation.withFail
    }
    if (!variation.instance) {
      return Result.fail(EstoqueError.VARIACAO_NAO_ENCONTRADA)
    }

    return Result.ok({
      variacaoId: variation.instance.id,
      saldoAtual: 0,
      estoqueMinimo: variation.instance.minStock,
    })
  }
}
