import { Injectable } from '@nestjs/common';
import { Result, TransactionContext } from '@repo/shared';
import { EstoquePortService, MotivoMovimentacaoEstoque } from '@repo/inventory';
import { EstoqueGateway, VendaError } from '@repo/sales';
import { EstoquePrismaRepository } from '../../inventory/adapters/estoque.prisma.repository';

/// Binds the `vendas` domain `EstoqueGateway` port to the `estoque` sales port
/// (`EstoquePort.darBaixa/estornar`). Sales take stock down as `SAIDA` `VENDA_PDV`
/// and reverse it as `ENTRADA` `DEVOLUCAO`, both carrying `origemVendaId`. The
/// estoque port's stock errors are normalized to the sale's `INSUFFICIENT_STOCK`.
@Injectable()
export class EstoqueGatewayAdapter implements EstoqueGateway {
  constructor(
    private readonly estoquePort: EstoquePortService,
    private readonly estoqueRepository: EstoquePrismaRepository,
  ) {}

  async validarSaldoDisponivel(
    variacaoId: string,
    quantidade: number,
  ): Promise<Result<void>> {
    const saldo =
      await this.estoqueRepository.findSaldoByVariacaoId(variacaoId);
    if (saldo.isFailure) {
      return Result.fail(VendaError.INSUFFICIENT_STOCK);
    }

    const current = saldo.instance;
    if (!current) {
      return Result.fail(VendaError.INSUFFICIENT_STOCK);
    }

    if (current.saldoAtual < quantidade) {
      return Result.fail(VendaError.INSUFFICIENT_STOCK);
    }

    return Result.ok();
  }

  async darBaixa(
    variacaoId: string,
    quantidade: number,
    origemVendaId: string,
    usuarioId: string,
    tx?: TransactionContext,
  ): Promise<Result<void>> {
    // RN06: forward the sale's transaction context so the stock exit commits/rolls back
    // within the same transaction as the sale.
    const result = await this.estoquePort.darBaixa(
      variacaoId,
      quantidade,
      origemVendaId,
      usuarioId,
      MotivoMovimentacaoEstoque.VENDA_PDV,
      tx,
    );
    return result.isFailure
      ? Result.fail(VendaError.INSUFFICIENT_STOCK)
      : result;
  }

  async estornar(
    variacaoId: string,
    quantidade: number,
    origemVendaId: string,
    usuarioId: string,
    tx?: TransactionContext,
  ): Promise<Result<void>> {
    // The estoque sales port records the reversal as an `ENTRADA` and only accepts
    // sale reasons; `VENDA_PDV` keeps the movement attributable to the originating
    // PDV sale via `origemVendaId` (the ledger tipo `ENTRADA` is the actual reversal).
    // The sale's transaction context is forwarded so the reversal joins it (RN06).
    return this.estoquePort.estornar(
      variacaoId,
      quantidade,
      origemVendaId,
      usuarioId,
      MotivoMovimentacaoEstoque.VENDA_PDV,
      tx,
    );
  }
}
