import { Result, UseCase } from '@repo/shared'
import { ItemAbaixoDoMinimoDTO, ListarAbaixoDoMinimoInputDTO } from '../dto'
import { EstoqueQuery } from '../provider'

export class ListarAbaixoDoMinimo
  implements UseCase<ListarAbaixoDoMinimoInputDTO, ItemAbaixoDoMinimoDTO[]>
{
  constructor(private readonly estoqueQuery: EstoqueQuery) {}

  async execute(_: ListarAbaixoDoMinimoInputDTO): Promise<Result<ItemAbaixoDoMinimoDTO[]>> {
    return this.estoqueQuery.listarAbaixoDoMinimo()
  }
}
