import { Entity, EntityProps, Id, Result } from '@repo/shared'
import { CaixaError } from '../errors'
import { StatusSessaoCaixa } from './status-sessao-caixa'
import { ValorMonetario } from './valor-monetario.vo'

export interface SessaoCaixaProps extends EntityProps {
  operadorId: string
  status: StatusSessaoCaixa
  valorAbertura: number
  valorFechamento?: number | null
  abertaEm: Date
  fechadaEm?: Date | null
}

export interface AbrirSessaoCaixaProps extends EntityProps {
  operadorId: string
  valorAbertura: number
  abertaEm?: Date
}

/// Aggregate root for a cash drawer session. Starts `ABERTA` and transitions to
/// `FECHADA` exactly once. `valorAbertura >= 0`; `valorFechamento >= 0` when set.
export class SessaoCaixa extends Entity<SessaoCaixa, SessaoCaixaProps> {
  private constructor(props: SessaoCaixaProps) {
    super(props)
  }

  /// Opens a new session in `ABERTA` status (RF-CX-01).
  static abrir(props: AbrirSessaoCaixaProps): Result<SessaoCaixa> {
    const operadorId = Id.required(props.operadorId, { attribute: 'operadorId' })
    const valorAbertura = ValorMonetario.tryCreate(props.valorAbertura, CaixaError.VALOR_INVALIDO)

    const validated = Result.combine([operadorId, valorAbertura])
    if (validated.isFailure) {
      return validated.withFail
    }

    const [validOperadorId, validValorAbertura] = validated.instance
    const abertaEm = props.abertaEm ?? new Date()

    return Result.ok(
      new SessaoCaixa({
        id: props.id,
        createdAt: props.createdAt ?? abertaEm,
        updatedAt: props.updatedAt ?? abertaEm,
        deletedAt: props.deletedAt,
        operadorId: validOperadorId.value,
        status: StatusSessaoCaixa.ABERTA,
        valorAbertura: validValorAbertura.value,
        valorFechamento: null,
        abertaEm,
        fechadaEm: null,
      }),
    )
  }

  /// Rehydrates a session from persistence without re-running the open invariants.
  static hydrate(props: SessaoCaixaProps): Result<SessaoCaixa> {
    const operadorId = Id.required(props.operadorId, { attribute: 'operadorId' })
    if (operadorId.isFailure) {
      return operadorId.withFail
    }

    return Result.ok(new SessaoCaixa({ ...props, operadorId: operadorId.instance.value }))
  }

  /// Legacy alias for `hydrate`, kept for external call sites (backend adapters).
  static restore(props: SessaoCaixaProps): Result<SessaoCaixa> {
    return SessaoCaixa.hydrate(props)
  }

  /// Closes an `ABERTA` session (RF-CX-07). Reopening a `FECHADA` session fails.
  fechar(valorFechamento: number, fechadaEm: Date = new Date()): Result<SessaoCaixa> {
    if (this.props.status === StatusSessaoCaixa.FECHADA) {
      return Result.fail(CaixaError.CAIXA_JA_FECHADO)
    }

    const valor = ValorMonetario.tryCreate(valorFechamento, CaixaError.VALOR_INVALIDO)
    if (valor.isFailure) {
      return valor.withFail
    }

    return Result.ok(
      new SessaoCaixa({
        ...this.props,
        status: StatusSessaoCaixa.FECHADA,
        valorFechamento: valor.instance.value,
        fechadaEm,
        updatedAt: fechadaEm,
      }),
    )
  }

  get operadorId(): string {
    return this.props.operadorId
  }

  get status(): StatusSessaoCaixa {
    return this.props.status
  }

  /// Legacy alias for `isAberta()`, kept for external call sites.
  get aberta(): boolean {
    return this.isAberta()
  }

  isAberta(): boolean {
    return this.props.status === StatusSessaoCaixa.ABERTA
  }

  isFechada(): boolean {
    return this.props.status === StatusSessaoCaixa.FECHADA
  }

  /// RN02/RN03: `true` when the session is owned by the given user.
  pertenceAoUsuario(usuarioId: string): boolean {
    return this.props.operadorId === usuarioId
  }

  get valorAbertura(): number {
    return this.props.valorAbertura
  }

  get valorFechamento(): number | null {
    return this.props.valorFechamento ?? null
  }

  get abertaEm(): Date {
    return this.props.abertaEm
  }

  get fechadaEm(): Date | null {
    return this.props.fechadaEm ?? null
  }
}
