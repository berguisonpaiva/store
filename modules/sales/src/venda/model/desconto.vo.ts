import { Result, ValueObject, ValueObjectConfig } from '@repo/shared'
import { VendaError } from '../errors'
import { TipoDesconto } from './tipo-desconto'

export interface DescontoProps {
  tipo: TipoDesconto
  /// For `VALOR`: the absolute discount in cents. For `PERCENTUAL`: the percentage
  /// (0..100) applied over the subtotal.
  valor: number
}

/// Discount applied to a sale, either an absolute `VALOR` (cents) or a `PERCENTUAL`
/// over the subtotal. The resolved discount amount never exceeds the subtotal
/// (RF-VND-05). The stored `valor` is validated but the effective amount is always
/// computed against the current subtotal via `amountFor`.
export class Desconto extends ValueObject<DescontoProps, ValueObjectConfig> {
  private constructor(value: DescontoProps, config?: ValueObjectConfig) {
    super(value, config)
  }

  get tipo(): TipoDesconto {
    return this.value.tipo
  }

  get valor(): number {
    return this.value.valor
  }

  static zero(config?: ValueObjectConfig): Desconto {
    return new Desconto({ tipo: TipoDesconto.VALOR, valor: 0 }, config)
  }

  static create(value: DescontoProps, config?: ValueObjectConfig): Desconto {
    const result = Desconto.tryCreate(value, config)
    result.validator.throwsIfFailed()
    return result.instance
  }

  static tryCreate(value: DescontoProps, config?: ValueObjectConfig): Result<Desconto> {
    const { tipo, valor } = value ?? ({} as DescontoProps)

    if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0) {
      return Result.fail(VendaError.INVALID_DISCOUNT)
    }

    if (tipo === TipoDesconto.VALOR) {
      if (!Number.isInteger(valor)) {
        return Result.fail(VendaError.INVALID_DISCOUNT)
      }
      return Result.ok(new Desconto({ tipo, valor }, config))
    }

    if (tipo === TipoDesconto.PERCENTUAL) {
      if (valor > 100) {
        return Result.fail(VendaError.INVALID_DISCOUNT)
      }
      return Result.ok(new Desconto({ tipo, valor }, config))
    }

    return Result.fail(VendaError.INVALID_DISCOUNT)
  }

  /// Resolved discount amount (in cents) for the given subtotal, always capped at it.
  amountFor(subtotalCents: number): number {
    const raw =
      this.value.tipo === TipoDesconto.PERCENTUAL
        ? Math.round((subtotalCents * this.value.valor) / 100)
        : this.value.valor

    return Math.min(Math.max(0, raw), Math.max(0, subtotalCents))
  }

  /// `true` when the requested discount would be larger than the subtotal. Only an
  /// absolute `VALOR` can exceed the subtotal; a percentage (0..100) never does.
  exceedsSubtotal(subtotalCents: number): boolean {
    if (this.value.tipo !== TipoDesconto.VALOR) {
      return false
    }
    return this.value.valor > subtotalCents
  }
}
