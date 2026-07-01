import { Result, ValueObject, ValueObjectConfig } from '@repo/shared'
import { VendaError } from '../errors'

/// Non-negative money value object stored as an integer number of cents to avoid
/// floating-point drift. Used for every monetary field of a sale (`precoUnitario`,
/// line/sale `subtotal`, `desconto`, `total`, payment `valor`). Never use float.
export class Dinheiro extends ValueObject<number, ValueObjectConfig> {
  protected constructor(value: number, config?: ValueObjectConfig) {
    super(value, config)
  }

  /// Amount in cents (the canonical stored unit).
  get cents(): number {
    return this.value
  }

  static zero(config?: ValueObjectConfig): Dinheiro {
    return new Dinheiro(0, config)
  }

  static create(
    value: number,
    errorCode: string = VendaError.INVALID_PRICE,
    config?: ValueObjectConfig,
  ): Dinheiro {
    const result = Dinheiro.tryCreate(value, errorCode, config)
    result.validator.throwsIfFailed()
    return result.instance
  }

  static tryCreate(
    value: number,
    errorCode: string = VendaError.INVALID_PRICE,
    config?: ValueObjectConfig,
  ): Result<Dinheiro> {
    if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
      return Result.fail(errorCode)
    }

    return Result.ok(new Dinheiro(value, config))
  }

  add(other: Dinheiro): Dinheiro {
    return new Dinheiro(this.value + other.value)
  }

  subtract(other: Dinheiro): Dinheiro {
    return new Dinheiro(Math.max(0, this.value - other.value))
  }

  multiply(factor: number): Dinheiro {
    return new Dinheiro(this.value * factor)
  }

  isGreaterThan(other: Dinheiro): boolean {
    return this.value > other.value
  }

  isLessThan(other: Dinheiro): boolean {
    return this.value < other.value
  }
}
