import { Entity, EntityProps, Id, Result } from '@repo/shared'
import { EstoqueError } from '../errors'
import { QuantidadeMovimentada } from './quantidade-movimentada.vo'
import { SaldoResultante } from './saldo-resultante.vo'
import { TipoMovimentacao } from './tipo-movimentacao'
import { MotivoMovimentacaoEstoque } from './motivo-movimentacao-estoque'

export interface MovimentacaoEstoqueProps extends EntityProps {
  variacaoId: string
  tipo: TipoMovimentacao
  motivo: MotivoMovimentacaoEstoque
  quantidade: number
  saldoResultante: number
  origemVendaId?: string | null
  usuarioId: string
}

export interface CreateMovimentacaoEstoqueProps extends EntityProps {
  variacaoId: string
  tipo: TipoMovimentacao
  motivo: MotivoMovimentacaoEstoque
  quantidade: number
  saldoAnterior: number
  origemVendaId?: string | null
  usuarioId: string
  criadoEm?: Date
}

export class MovimentacaoEstoque extends Entity<MovimentacaoEstoque, MovimentacaoEstoqueProps> {
  private constructor(props: MovimentacaoEstoqueProps) {
    super(props)
  }

  static create(props: CreateMovimentacaoEstoqueProps): MovimentacaoEstoque {
    const result = MovimentacaoEstoque.tryCreate(props)
    result.validator.throwsIfFailed()
    return result.instance
  }

  static tryCreate(props: CreateMovimentacaoEstoqueProps): Result<MovimentacaoEstoque> {
    const variacaoId = Id.required(props.variacaoId, { attribute: 'variacaoId' })
    const usuarioId = Id.required(props.usuarioId, { attribute: 'usuarioId' })
    const quantidade = QuantidadeMovimentada.tryCreate(props.quantidade)

    const validated = Result.combine([variacaoId, usuarioId, quantidade])
    if (validated.isFailure) {
      return validated.withFail
    }

    const [validVariacaoId, validUsuarioId, validQuantidade] = validated.instance
    const saldoResultanteValue =
      props.tipo === TipoMovimentacao.ENTRADA
        ? props.saldoAnterior + validQuantidade.value
        : props.saldoAnterior - validQuantidade.value

    const saldoResultante = SaldoResultante.tryCreate(saldoResultanteValue)
    if (saldoResultante.isFailure) {
      return saldoResultante.withFail
    }

    return Result.ok(
      new MovimentacaoEstoque({
        id: props.id,
        createdAt: props.criadoEm ?? props.createdAt,
        updatedAt: props.criadoEm ?? props.updatedAt ?? props.createdAt,
        deletedAt: props.deletedAt,
        variacaoId: validVariacaoId.value,
        tipo: props.tipo,
        motivo: props.motivo,
        quantidade: validQuantidade.value,
        saldoResultante: saldoResultante.instance.value,
        origemVendaId: props.origemVendaId?.trim() || null,
        usuarioId: validUsuarioId.value,
      }),
    )
  }

  override cloneWith(_: Partial<MovimentacaoEstoqueProps>): Result<MovimentacaoEstoque> {
    return Result.fail(EstoqueError.LEDGER_IMUTAVEL)
  }

  get variacaoId(): string {
    return this.props.variacaoId
  }

  get tipo(): TipoMovimentacao {
    return this.props.tipo
  }

  get motivo(): MotivoMovimentacaoEstoque {
    return this.props.motivo
  }

  get quantidade(): number {
    return this.props.quantidade
  }

  get saldoResultante(): number {
    return this.props.saldoResultante
  }

  get origemVendaId(): string | null {
    return this.props.origemVendaId ?? null
  }

  get usuarioId(): string {
    return this.props.usuarioId
  }

  get criadoEm(): Date {
    return this.createdAt
  }
}
