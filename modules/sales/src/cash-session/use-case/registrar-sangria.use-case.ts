import { Result, UseCase } from '@repo/shared'
import { RegistrarMovimentacaoInputDTO } from '../dto'
import { MovimentacaoCaixa, TipoMovimentacaoCaixa } from '../model'
import { CaixaRepository } from '../provider'
import { RegistrarMovimentacaoBase } from './registrar-movimentacao.base'

/// Records a `SANGRIA` (cash withdrawal) on an existing session (RF-CX-03).
export class RegistrarSangria
  extends RegistrarMovimentacaoBase
  implements UseCase<RegistrarMovimentacaoInputDTO, MovimentacaoCaixa>
{
  constructor(repository: CaixaRepository) {
    super(repository)
  }

  async execute(input: RegistrarMovimentacaoInputDTO): Promise<Result<MovimentacaoCaixa>> {
    return this.registrar(TipoMovimentacaoCaixa.SANGRIA, input)
  }
}
