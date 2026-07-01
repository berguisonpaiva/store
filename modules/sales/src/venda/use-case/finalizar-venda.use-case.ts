import { Result, TransactionContext, TransactionManager, UseCase } from '@repo/shared'
import { FinalizarVendaInputDTO, toVendaDTO, VendaDTO } from '../dto'
import { VendaError } from '../errors'
import { Venda } from '../model'
import { CaixaGateway, EstoqueGateway, VendasRepository } from '../provider'

interface BaixaAplicada {
  variacaoId: string
  quantidade: number
}

/// Finalizes an `ABERTA` sale as a single orchestrated, atomic transaction
/// (RF-VND-07/08):
///   1. validate available balance for each item (`EstoqueGateway`);
///   2. take stock down per item — `VENDA_PDV`, carrying `origemVendaId`;
///   3. persist the sale's payments (enforce `Σ pagamentos = total`);
///   4. register a `VENDA` cash movement for the total (`CaixaGateway`);
///   5. set status `CONCLUIDA`.
/// A failure at any step reverts all prior steps and the sale stays `ABERTA`.
export class FinalizarVenda implements UseCase<FinalizarVendaInputDTO, VendaDTO> {
  constructor(
    private readonly repository: VendasRepository,
    private readonly estoqueGateway: EstoqueGateway,
    private readonly caixaGateway: CaixaGateway,
    private readonly transactionManager?: TransactionManager,
  ) {}

  async execute(input: FinalizarVendaInputDTO): Promise<Result<VendaDTO>> {
    const found = await this.repository.findById(input.vendaId)
    if (found.isFailure) {
      return found.withFail
    }
    if (!found.instance) {
      return Result.fail(VendaError.SALE_NOT_FOUND)
    }

    const venda = found.instance
    if (venda.isConcluida) {
      return Result.fail(VendaError.SALE_ALREADY_FINALIZED)
    }
    if (!venda.isAberta) {
      return Result.fail(VendaError.SALE_NOT_OPEN)
    }
    if (venda.itens.length === 0) {
      return Result.fail(VendaError.SALE_HAS_NO_ITEMS)
    }

    // Bind payments and enforce Σ pagamentos = total before touching stock/cash.
    const withPayments = venda.definirPagamentos(input.pagamentos)
    if (withPayments.isFailure) {
      return withPayments.withFail
    }
    const prepared = withPayments.instance
    if (prepared.totalPagamentos !== prepared.total) {
      return Result.fail(VendaError.PAYMENT_MISMATCH)
    }

    const run = (tx?: TransactionContext) => this.orchestrate(prepared, tx)

    if (this.transactionManager) {
      return this.transactionManager.runInTransaction((tx) => run(tx))
    }
    return run()
  }

  private async orchestrate(venda: Venda, tx?: TransactionContext): Promise<Result<VendaDTO>> {
    // Step 1: validate available balance for every item.
    for (const item of venda.itens) {
      const ok = await this.estoqueGateway.validarSaldoDisponivel(item.variacaoId, item.quantidade)
      if (ok.isFailure) {
        return Result.fail(VendaError.INSUFFICIENT_STOCK)
      }
    }

    // Step 2: take stock down per item, tracking applied take-downs for rollback.
    const baixas: BaixaAplicada[] = []
    for (const item of venda.itens) {
      const baixa = await this.estoqueGateway.darBaixa(item.variacaoId, item.quantidade, venda.id, venda.usuarioId, tx)
      if (baixa.isFailure) {
        await this.rollbackBaixas(baixas, venda.id, venda.usuarioId, tx)
        return Result.fail(VendaError.INSUFFICIENT_STOCK)
      }
      baixas.push({ variacaoId: item.variacaoId, quantidade: item.quantidade })
    }

    // Step 3: persist payments + (Step 5 prep) flip status to CONCLUIDA on the entity.
    const concluida = venda.concluir()
    if (concluida.isFailure) {
      await this.rollbackBaixas(baixas, venda.id, venda.usuarioId, tx)
      return concluida.withFail
    }

    const persisted = await this.repository.update(concluida.instance, tx)
    if (persisted.isFailure) {
      await this.rollbackBaixas(baixas, venda.id, venda.usuarioId, tx)
      return persisted.withFail
    }

    // Step 4: register the VENDA cash movement for the total.
    const caixa = await this.caixaGateway.registrarVenda(venda.sessaoCaixaId, concluida.instance.total, tx)
    if (caixa.isFailure) {
      // revert payments/status by restoring the ABERTA aggregate, then the stock.
      await this.repository.update(venda, tx)
      await this.rollbackBaixas(baixas, venda.id, venda.usuarioId, tx)
      return caixa.withFail
    }

    return Result.ok(toVendaDTO(concluida.instance))
  }

  private async rollbackBaixas(
    baixas: BaixaAplicada[],
    origemVendaId: string,
    usuarioId: string,
    tx?: TransactionContext,
  ): Promise<void> {
    for (const baixa of baixas) {
      await this.estoqueGateway.estornar(baixa.variacaoId, baixa.quantidade, origemVendaId, usuarioId, tx)
    }
  }
}
