import { Result, UseCase } from '@repo/shared'
import { CriarVendaInputDTO, toVendaDTO, VendaDTO } from '../dto'
import { VendaError } from '../errors'
import { Venda } from '../model'
import { CaixaGateway, VendasRepository } from '../provider'

/// Creates an `ABERTA` sale bound to the operator's open cash session. Without an
/// open session it fails with `NO_OPEN_CASH_SESSION` and nothing is persisted
/// (RF-VND-01/02).
export class CriarVenda implements UseCase<CriarVendaInputDTO, VendaDTO> {
  constructor(
    private readonly repository: VendasRepository,
    private readonly caixaGateway: CaixaGateway,
  ) {}

  async execute(input: CriarVendaInputDTO): Promise<Result<VendaDTO>> {
    const sessao = await this.caixaGateway.caixaAbertoDoOperador(input.usuarioId)
    if (sessao.isFailure) {
      return sessao.withFail
    }
    if (!sessao.instance || !sessao.instance.aberta) {
      return Result.fail(VendaError.NO_OPEN_CASH_SESSION)
    }

    const venda = Venda.abrir({
      usuarioId: input.usuarioId,
      sessaoCaixaId: sessao.instance.sessaoCaixaId,
    })
    if (venda.isFailure) {
      return venda.withFail
    }

    const created = await this.repository.create(venda.instance)
    if (created.isFailure) {
      return created.withFail
    }

    return Result.ok(toVendaDTO(venda.instance))
  }
}
