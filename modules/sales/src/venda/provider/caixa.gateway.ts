import { Result, TransactionContext } from '@repo/shared'

/// The operator's open cash session as seen by `vendas`. Minimal projection — the
/// `vendas` domain only needs the session id and whether it is open.
export interface SessaoCaixaResumo {
  sessaoCaixaId: string
  aberta: boolean
}

/// Port CONSUMED by `vendas` to orchestrate cash during create/finalize/cancel.
/// Declared here in the domain (design D2); the backend adapter binds it to the
/// `caixa` sales port (`CaixaPort.caixaAbertoDoOperador/registrarVenda`). The domain
/// never imports `caixa`.
export interface CaixaGateway {
  /// Returns the operator's open (`ABERTA`) session, or `null` when none is open.
  caixaAbertoDoOperador(usuarioId: string): Promise<Result<SessaoCaixaResumo | null>>

  /// `true` when the given session is currently open. Used by `cancelar-venda` to
  /// block cancellation after the session has closed.
  isSessaoAberta(sessaoCaixaId: string): Promise<Result<boolean>>

  /// Records a `VENDA` cash movement of `valor` (cents) against the session, inside
  /// the passed transactional context.
  registrarVenda(sessaoCaixaId: string, valor: number, tx?: TransactionContext): Promise<Result<void>>

  /// Reverses a prior `VENDA` cash movement of `valor` (cents). Used on cancel and on
  /// finalize rollback.
  estornarVenda(sessaoCaixaId: string, valor: number, tx?: TransactionContext): Promise<Result<void>>
}
