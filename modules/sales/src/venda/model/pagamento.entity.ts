import { Entity, EntityProps, Result } from '@repo/shared'
import { VendaError } from '../errors'
import { Dinheiro } from './dinheiro.vo'
import { FormaPagamento } from './forma-pagamento'

export interface PagamentoProps extends EntityProps {
  forma: FormaPagamento
  /// Paid amount in cents. MUST be `> 0`.
  valor: number
}

export interface CreatePagamentoProps extends EntityProps {
  forma: FormaPagamento
  valor: number
}

/// A payment line. Owned by the `Venda` aggregate (MVP 1: no separate payments
/// module). Carries only `forma` + `valor`.
export class Pagamento extends Entity<Pagamento, PagamentoProps> {
  private constructor(props: PagamentoProps) {
    super(props)
  }

  static create(props: CreatePagamentoProps): Pagamento {
    const result = Pagamento.tryCreate(props)
    result.validator.throwsIfFailed()
    return result.instance
  }

  static tryCreate(props: CreatePagamentoProps): Result<Pagamento> {
    if (!Object.values(FormaPagamento).includes(props.forma)) {
      return Result.fail(VendaError.INVALID_PAYMENT)
    }

    const valor = Dinheiro.tryCreate(props.valor, VendaError.INVALID_PAYMENT)
    if (valor.isFailure) {
      return valor.withFail
    }
    if (valor.instance.cents <= 0) {
      return Result.fail(VendaError.INVALID_PAYMENT)
    }

    return Result.ok(
      new Pagamento({
        id: props.id,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
        forma: props.forma,
        valor: valor.instance.cents,
      }),
    )
  }

  get forma(): FormaPagamento {
    return this.props.forma
  }

  get valor(): number {
    return this.props.valor
  }
}
