import { Result, UseCase } from '@repo/shared'
import { AlterarQuantidadeItemInputDTO, toVendaDTO, VendaDTO } from '../dto'
import { VendaError } from '../errors'
import { EstoqueGateway, VendasRepository } from '../provider'
import { VendaUseCaseBase } from './venda-use-case.base'

/// Changes the quantity of an existing line on an `ABERTA` sale, keeping the price
/// snapshot and recomputing totals. Only the sale's owner may edit it
/// (`ACESSO_NEGADO` otherwise); an unknown line fails with `ITEM_NOT_FOUND`.
///
/// RN09 re-check: the NEW quantity is revalidated against available stock via
/// `EstoqueGateway.validarSaldoDisponivel` (same pattern as `AdicionarItem`);
/// insufficient stock fails with `INSUFFICIENT_STOCK` and the item keeps its
/// previous quantity. The authoritative atomic decrement still happens at finalize.
export class AlterarQuantidadeItem
  extends VendaUseCaseBase
  implements UseCase<AlterarQuantidadeItemInputDTO, VendaDTO>
{
  constructor(
    repository: VendasRepository,
    private readonly estoqueGateway: EstoqueGateway,
  ) {
    super(repository)
  }

  async execute(input: AlterarQuantidadeItemInputDTO): Promise<Result<VendaDTO>> {
    const venda = await this.loadVenda(input.vendaId)
    if (venda.isFailure) {
      return venda.withFail
    }

    if (venda.instance.usuarioId !== input.usuarioId) {
      return Result.fail(VendaError.ACESSO_NEGADO)
    }

    // RN06: a CONCLUIDA sale is immutable; only ABERTA sales accept edits.
    if (venda.instance.isConcluida) {
      return Result.fail(VendaError.SALE_ALREADY_FINALIZED)
    }
    if (!venda.instance.isAberta) {
      return Result.fail(VendaError.SALE_NOT_OPEN)
    }

    const item = venda.instance.itens.find((candidate) => candidate.id === input.itemId)
    if (!item) {
      return Result.fail(VendaError.ITEM_NOT_FOUND)
    }

    // RN09 re-check for the NEW quantity of this line's variation.
    const saldo = await this.estoqueGateway.validarSaldoDisponivel(item.variacaoId, input.quantidade)
    if (saldo.isFailure) {
      return Result.fail(VendaError.INSUFFICIENT_STOCK)
    }

    const updated = await this.applyAndSave(
      venda.instance.alterarQuantidadeItem(input.itemId, input.quantidade),
    )
    if (updated.isFailure) {
      return updated.withFail
    }

    return Result.ok(toVendaDTO(updated.instance))
  }
}
