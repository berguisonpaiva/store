import { Entity, EntityProps, Id, Result } from '@repo/shared'
import { CaixaError } from '../errors'
import { TipoMovimentacaoCaixa } from './tipo-movimentacao-caixa'
import { ValorPositivo } from './valor-positivo.vo'

export interface MovimentacaoCaixaProps extends EntityProps {
  sessaoId: string
  tipo: TipoMovimentacaoCaixa
  valor: number
  observacao?: string | null
}

export interface CreateMovimentacaoCaixaProps extends EntityProps {
  sessaoId: string
  valor: number
  observacao?: string | null
  criadaEm?: Date
}

/// Cash movement scoped to a `SessaoCaixa`. `valor` is always `> 0`.
/// A `VENDA` movement MUST only be created through `criarVenda`, which is
/// exclusively reachable from the cash port consumed by `vendas` — never via a
/// manual command. `SUPRIMENTO`/`SANGRIA` are created through `criar`.
export class MovimentacaoCaixa extends Entity<MovimentacaoCaixa, MovimentacaoCaixaProps> {
  private constructor(props: MovimentacaoCaixaProps) {
    super(props)
  }

  static criar(
    tipo: TipoMovimentacaoCaixa.SUPRIMENTO | TipoMovimentacaoCaixa.SANGRIA,
    props: CreateMovimentacaoCaixaProps,
  ): Result<MovimentacaoCaixa> {
    return MovimentacaoCaixa.tryCreate(tipo, props)
  }

  /// Factory for cash sales recorded through the port. Kept separate so a `VENDA`
  /// movement cannot be produced by a public manual use case.
  static criarVenda(props: CreateMovimentacaoCaixaProps): Result<MovimentacaoCaixa> {
    return MovimentacaoCaixa.tryCreate(TipoMovimentacaoCaixa.VENDA, props)
  }

  private static tryCreate(
    tipo: TipoMovimentacaoCaixa,
    props: CreateMovimentacaoCaixaProps,
  ): Result<MovimentacaoCaixa> {
    const sessaoId = Id.required(props.sessaoId, { attribute: 'sessaoId' })
    const valor = ValorPositivo.tryCreate(props.valor)

    const validated = Result.combine([sessaoId, valor])
    if (validated.isFailure) {
      return validated.withFail
    }

    const [validSessaoId, validValor] = validated.instance

    return Result.ok(
      new MovimentacaoCaixa({
        id: props.id,
        createdAt: props.criadaEm ?? props.createdAt,
        updatedAt: props.criadaEm ?? props.updatedAt ?? props.createdAt,
        deletedAt: props.deletedAt,
        sessaoId: validSessaoId.value,
        tipo,
        valor: validValor.value,
        observacao: props.observacao?.trim() || null,
      }),
    )
  }

  override cloneWith(_: Partial<MovimentacaoCaixaProps>): Result<MovimentacaoCaixa> {
    return Result.fail(CaixaError.VALOR_MOVIMENTACAO_INVALIDO)
  }

  get sessaoId(): string {
    return this.props.sessaoId
  }

  get tipo(): TipoMovimentacaoCaixa {
    return this.props.tipo
  }

  get valor(): number {
    return this.props.valor
  }

  get observacao(): string | null {
    return this.props.observacao ?? null
  }

  get criadaEm(): Date {
    return this.createdAt
  }
}
