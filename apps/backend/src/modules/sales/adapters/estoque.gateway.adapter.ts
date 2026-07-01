import { Injectable } from '@nestjs/common';
import { Result, TransactionContext } from '@repo/shared';
import {
  EstoquePortService,
  MotivoMovimentacaoEstoque,
} from '@repo/inventory';
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
    const saldo = await this.estoqueRepository.findSaldoByVariacaoId(variacaoId);
    if (saldo.isFailure) {
      return Result.fail(VendaError.INSUFFICIENT_STOCK);
    }

    const current = saldo.instance;
    if (!current) {
      return Result.fail(VendaError.INSUFFICIENT_STOCK);
    }

    const disponivel = current.saldoAtual - current.quantidadeReservada;
    if (disponivel < quantidade) {
      return Result.fail(VendaError.INSUFFICIENT_STOCK);
    }

    return Result.ok();
  }

  async darBaixa(
    variacaoId: string,
    quantidade: number,
    origemVendaId: string,
    usuarioId: string,
    _tx?: TransactionContext,
  ): Promise<Result<void>> {
    const result = await this.estoquePort.darBaixa(
      variacaoId,
      quantidade,
      origemVendaId,
      usuarioId,
      MotivoMovimentacaoEstoque.VENDA_PDV,
    );
    return result.isFailure ? Result.fail(VendaError.INSUFFICIENT_STOCK) : result;
  }

  async estornar(
    variacaoId: string,
    quantidade: number,
    origemVendaId: string,
    usuarioId: string,
    _tx?: TransactionContext,
  ): Promise<Result<void>> {
    // The estoque sales port records the reversal as an `ENTRADA` and only accepts
    // sale reasons; `VENDA_PDV` keeps the movement attributable to the originating
    // PDV sale via `origemVendaId` (the ledger tipo `ENTRADA` is the actual reversal).
    return this.estoquePort.estornar(
      variacaoId,
      quantidade,
      origemVendaId,
      usuarioId,
      MotivoMovimentacaoEstoque.VENDA_PDV,
    );
  }
}
