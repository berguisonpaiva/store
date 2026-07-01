import { Result } from '@repo/shared'
import { EstoqueError } from '../errors'
import { CatalogVariationReader, EstoquePort, EstoqueRepository } from '../provider'
import { EstoquePolicyService } from '../service'
import { MotivoMovimentacaoEstoque, TipoMovimentacao } from '../model'
import { EstoqueUseCaseBase } from './estoque-use-case.base'

const SALE_REASONS = new Set([MotivoMovimentacaoEstoque.VENDA_PDV, MotivoMovimentacaoEstoque.VENDA_ONLINE])

export class EstoquePortService extends EstoqueUseCaseBase implements EstoquePort {
  constructor(repository: EstoqueRepository, catalogVariationReader: CatalogVariationReader) {
    super(repository, catalogVariationReader)
  }

  async darBaixa(
    variacaoId: string,
    quantidade: number,
    origemVendaId: string,
    usuarioId: string,
    motivo: MotivoMovimentacaoEstoque = MotivoMovimentacaoEstoque.VENDA_ONLINE,
  ): Promise<Result<void>> {
    if (!SALE_REASONS.has(motivo)) {
      return Result.fail(EstoqueError.MOTIVO_MOVIMENTACAO_INVALIDO)
    }

    const context = await this.loadContext(variacaoId)
    if (context.isFailure) {
      return context.withFail
    }

    const availableBalance = EstoquePolicyService.assertSaldoDisponivel(
      context.instance.saldo.saldoAtual,
      context.instance.saldo.quantidadeReservada,
      quantidade,
    )
    if (availableBalance.isFailure) {
      return availableBalance.withFail
    }

    return this.persistMovement(context.instance.saldo, {
      tipo: TipoMovimentacao.SAIDA,
      motivo,
      quantidade,
      origemVendaId,
      usuarioId,
    })
  }

  async estornar(
    variacaoId: string,
    quantidade: number,
    origemVendaId: string,
    usuarioId: string,
    motivo: MotivoMovimentacaoEstoque = MotivoMovimentacaoEstoque.VENDA_ONLINE,
  ): Promise<Result<void>> {
    if (!SALE_REASONS.has(motivo)) {
      return Result.fail(EstoqueError.MOTIVO_MOVIMENTACAO_INVALIDO)
    }

    const context = await this.loadContext(variacaoId)
    if (context.isFailure) {
      return context.withFail
    }

    return this.persistMovement(context.instance.saldo, {
      tipo: TipoMovimentacao.ENTRADA,
      motivo,
      quantidade,
      origemVendaId,
      usuarioId,
    })
  }
}
