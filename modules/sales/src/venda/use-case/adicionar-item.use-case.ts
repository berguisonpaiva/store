import { Result, UseCase } from '@repo/shared'
import { AdicionarItemInputDTO, toVendaDTO, VendaDTO } from '../dto'
import { VendaError } from '../errors'
import { EstoqueGateway, VendasRepository } from '../provider'
import { VendaUseCaseBase } from './venda-use-case.base'

/// Adds an item to an `ABERTA` sale, capturing `precoUnitario` as a snapshot
/// (RF-VND-03). Rejects writes to a `CONCLUIDA` sale with `SALE_ALREADY_FINALIZED`.
///
/// RN09 pre-check: before committing the line, the EFFECTIVE resulting quantity of
/// the variation in this sale (existing lines of the same `variacaoId` + the new
/// quantity) is validated against available stock via
/// `EstoqueGateway.validarSaldoDisponivel`; insufficient stock fails with
/// `INSUFFICIENT_STOCK` and no item is added. The authoritative atomic decrement
/// still happens at finalize.
export class AdicionarItem extends VendaUseCaseBase implements UseCase<AdicionarItemInputDTO, VendaDTO> {
  constructor(
    repository: VendasRepository,
    private readonly estoqueGateway: EstoqueGateway,
  ) {
    super(repository)
  }

  async execute(input: AdicionarItemInputDTO): Promise<Result<VendaDTO>> {
    const venda = await this.loadVenda(input.vendaId)
    if (venda.isFailure) {
      return venda.withFail
    }

    // RN09 pre-check on the EFFECTIVE resulting quantity for this variation.
    const quantidadeExistente = venda.instance.itens
      .filter((item) => item.variacaoId === input.variacaoId)
      .reduce((total, item) => total + item.quantidade, 0)
    const quantidadeEfetiva = quantidadeExistente + input.quantidade

    const saldo = await this.estoqueGateway.validarSaldoDisponivel(input.variacaoId, quantidadeEfetiva)
    if (saldo.isFailure) {
      return Result.fail(VendaError.INSUFFICIENT_STOCK)
    }

    const updated = await this.applyAndSave(
      venda.instance.adicionarItem({
        variacaoId: input.variacaoId,
        quantidade: input.quantidade,
        precoUnitario: input.precoUnitario,
      }),
    )
    if (updated.isFailure) {
      return updated.withFail
    }

    return Result.ok(toVendaDTO(updated.instance))
  }
}
