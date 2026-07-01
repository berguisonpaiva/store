import { NonNegative, Result, ValueObject, ValueObjectConfig } from '@repo/shared'
import { EstoqueError } from '../errors'

export class Saldo extends ValueObject<number, ValueObjectConfig> {
  protected constructor(value: number, config?: ValueObjectConfig) {
    super(value, config)
  }

  static create(value: number, config?: ValueObjectConfig): Saldo {
    const result = Saldo.tryCreate(value, config)
    result.validator.throwsIfFailed()
    return result.instance
  }

  static tryCreate(value: number, config?: ValueObjectConfig): Result<Saldo> {
    if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value)) {
      return Result.fail(EstoqueError.SALDO_INVALIDO)
    }

    const nonNegative = NonNegative.tryCreate(value)
    if (nonNegative.isFailure) {
      return Result.fail(EstoqueError.SALDO_INVALIDO)
    }

    return Result.ok(new Saldo(value, config))
  }
}
