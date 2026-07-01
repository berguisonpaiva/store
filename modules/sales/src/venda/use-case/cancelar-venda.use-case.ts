import { Result, TransactionContext, TransactionManager, UseCase } from '@repo/shared'
import { CancelarVendaInputDTO, toVendaDTO, VendaDTO } from '../dto'
import { VendaError } from '../errors'
import { Venda } from '../model'
import { CaixaGateway, EstoqueGateway, VendasRepository } from '../provider'

/// Cancels a sale by reversing stock (`DEVOLUCAO` per item) and reverting the cash
/// `VENDA` movement, then setting status `CANCELADA`. Only allowed while the sale's
/// cash session is still open (RF-VND-10). A missing sale → `SALE_NOT_FOUND`.
export class CancelarVenda implements UseCase<CancelarVendaInputDTO, VendaDTO> {
  constructor(
    private readonly repository: VendasRepository,
    private readonly estoqueGateway: EstoqueGateway,
    private readonly caixaGateway: CaixaGateway,
    private readonly transactionManager?: TransactionManager,
  ) {}

  async execute(input: CancelarVendaInputDTO): Promise<Result<VendaDTO>> {
    const found = await this.repository.findById(input.vendaId)
    if (found.isFailure) {
      return found.withFail
    }
    if (!found.instance) {
      return Result.fail(VendaError.SALE_NOT_FOUND)
    }

    const venda = found.instance
    if (venda.isCancelada) {
      return Result.fail(VendaError.SALE_NOT_OPEN)
    }

    const sessaoAberta = await this.caixaGateway.isSessaoAberta(venda.sessaoCaixaId)
    if (sessaoAberta.isFailure) {
      return sessaoAberta.withFail
    }
    if (!sessaoAberta.instance) {
      return Result.fail(VendaError.CASH_SESSION_CLOSED)
    }

    const run = (tx?: TransactionContext) => this.orchestrate(venda, tx)

    if (this.transactionManager) {
      return this.transactionManager.runInTransaction((tx) => run(tx))
    }
    return run()
  }

  private async orchestrate(venda: Venda, tx?: TransactionContext): Promise<Result<VendaDTO>> {
    // Reverse stock for every item (only meaningful when the sale took stock down,
    // i.e. it was CONCLUIDA; for an ABERTA sale no stock moved, but estorno is safe
    // to skip — we only estornar what was concluded).
    if (venda.isConcluida) {
      for (const item of venda.itens) {
        const estorno = await this.estoqueGateway.estornar(item.variacaoId, item.quantidade, venda.id, venda.usuarioId, tx)
        if (estorno.isFailure) {
          return estorno.withFail
        }
      }

      const caixa = await this.caixaGateway.estornarVenda(venda.sessaoCaixaId, venda.total, tx)
      if (caixa.isFailure) {
        return caixa.withFail
      }
    }

    const cancelada = venda.cancelar()
    if (cancelada.isFailure) {
      return cancelada.withFail
    }

    const persisted = await this.repository.update(cancelada.instance, tx)
    if (persisted.isFailure) {
      return persisted.withFail
    }

    return Result.ok(toVendaDTO(cancelada.instance))
  }
}
