import { Result, ValueObject, ValueObjectConfig } from '@repo/shared'
import { CaixaError } from '../errors'

/// Non-negative money value object stored as an integer number of cents to avoid
/// floating-point drift. Used for cash-session opening/closing balances (`>= 0`).
export class ValorMonetario extends ValueObject<number, ValueObjectConfig> {
  protected constructor(value: number, config?: ValueObjectConfig) {
    super(value, config)
  }

  /// Amount in cents (the canonical stored unit).
  get cents(): number {
    return this.value
  }

  static create(
    value: number,
    errorCode: string = CaixaError.VALOR_MOVIMENTACAO_INVALIDO,
    config?: ValueObjectConfig,
  ): ValorMonetario {
    const result = ValorMonetario.tryCreate(value, errorCode, config)
    result.validator.throwsIfFailed()
    return result.instance
  }

  static tryCreate(
    value: number,
    errorCode: string = CaixaError.VALOR_MOVIMENTACAO_INVALIDO,
    config?: ValueObjectConfig,
  ): Result<ValorMonetario> {
    if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
      return Result.fail(errorCode)
    }

    return Result.ok(new ValorMonetario(value, config))
  }
}
