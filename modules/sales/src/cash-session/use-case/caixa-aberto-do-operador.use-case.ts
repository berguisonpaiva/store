import { Result, UseCase } from '@repo/shared'
import { CaixaAbertoDoOperadorInputDTO, SessaoCaixaDTO } from '../dto'
import { CaixaQuery } from '../provider'

/// Returns the operator's current `ABERTA` session, or `null` when none is open
/// (RF-CX-09).
export class CaixaAbertoDoOperador
  implements UseCase<CaixaAbertoDoOperadorInputDTO, SessaoCaixaDTO | null>
{
  constructor(private readonly query: CaixaQuery) {}

  async execute(input: CaixaAbertoDoOperadorInputDTO): Promise<Result<SessaoCaixaDTO | null>> {
    return this.query.caixaAbertoDoOperador(input.operadorId)
  }
}
