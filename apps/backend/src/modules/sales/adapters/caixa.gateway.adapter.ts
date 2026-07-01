import { Injectable } from '@nestjs/common';
import { Result, TransactionContext } from '@repo/shared';
import {
  CaixaGateway,
  CaixaPortService,
  MovimentacaoCaixa,
  SessaoCaixaResumo,
  TipoMovimentacaoCaixa,
} from '@repo/sales';
import { CaixaPrismaRepository } from '../cash-session/adapters/caixa.prisma.repository';

/// Binds the `vendas` domain `CaixaGateway` port to the `caixa` cash port. The
/// open-session lookup and the `VENDA` movement go through `CaixaPortService` (the
/// sanctioned surface); session-state checks and the cancel-time cash reversal use
/// the caixa repository. The reversal is recorded as a `SANGRIA` (cash leaving the
/// drawer) of the same value, which nets the sale's cash to zero in the session
/// summary (`vendasDinheiro - sangrias`).
@Injectable()
export class CaixaGatewayAdapter implements CaixaGateway {
  constructor(
    private readonly caixaPort: CaixaPortService,
    private readonly caixaRepository: CaixaPrismaRepository,
  ) {}

  async caixaAbertoDoOperador(
    usuarioId: string,
  ): Promise<Result<SessaoCaixaResumo | null>> {
    const sessao = await this.caixaPort.caixaAbertoDoOperador(usuarioId);
    if (sessao.isFailure) {
      return sessao.withFail;
    }
    if (!sessao.instance) {
      return Result.ok(null);
    }
    return Result.ok({
      sessaoCaixaId: sessao.instance.id,
      aberta: true,
    });
  }

  async isSessaoAberta(sessaoCaixaId: string): Promise<Result<boolean>> {
    const sessao = await this.caixaRepository.findSessaoById(sessaoCaixaId);
    if (sessao.isFailure) {
      return sessao.withFail;
    }
    return Result.ok(Boolean(sessao.instance?.aberta));
  }

  async registrarVenda(
    sessaoCaixaId: string,
    valor: number,
    _tx?: TransactionContext,
  ): Promise<Result<void>> {
    return this.caixaPort.registrarVenda(sessaoCaixaId, valor);
  }

  async estornarVenda(
    sessaoCaixaId: string,
    valor: number,
    _tx?: TransactionContext,
  ): Promise<Result<void>> {
    const movimentacao = MovimentacaoCaixa.criar(
      TipoMovimentacaoCaixa.SANGRIA,
      {
        sessaoId: sessaoCaixaId,
        valor,
        observacao: 'Estorno de venda cancelada',
      },
    );
    if (movimentacao.isFailure) {
      return movimentacao.withFail;
    }

    const persisted = await this.caixaRepository.registrarMovimentacao(
      movimentacao.instance,
    );
    if (persisted.isFailure) {
      return persisted.withFail;
    }

    return Result.ok();
  }
}
