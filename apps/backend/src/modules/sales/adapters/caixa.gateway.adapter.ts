import { Injectable } from '@nestjs/common';
import { Result, TransactionContext } from '@repo/shared';
import { CaixaGateway, CaixaPortService, SessaoCaixaResumo } from '@repo/sales';

/// Binds the `vendas` domain `CaixaGateway` port to the sealed `caixa` cash port
/// (`CaixaPortService`). Every interaction — open-session lookup, session-state
/// check, the `VENDA` movement, and its reversal — flows through `CaixaPort`
/// (Decision 3); the adapter never touches the caixa repository directly, and the
/// `tx` is threaded so cash joins the sale's single transaction (RN09).
@Injectable()
export class CaixaGatewayAdapter implements CaixaGateway {
  constructor(private readonly caixaPort: CaixaPortService) {}

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
    return this.caixaPort.isSessaoAberta(sessaoCaixaId);
  }

  async registrarVenda(
    sessaoCaixaId: string,
    valor: number,
    tx?: TransactionContext,
  ): Promise<Result<void>> {
    return this.caixaPort.registrarVenda(sessaoCaixaId, valor, tx);
  }

  async estornarVenda(
    sessaoCaixaId: string,
    valor: number,
    tx?: TransactionContext,
  ): Promise<Result<void>> {
    return this.caixaPort.estornarVenda(sessaoCaixaId, valor, tx);
  }
}
