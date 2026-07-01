import { Result, ValueObject, ValueObjectConfig } from '@repo/shared'
import { CaixaError } from '../errors'

/// Strictly-positive money value object stored as an integer number of cents.
/// Used for cash movements, whose `valor` MUST be `> 0` (RF-CX-03/04/05).
export class ValorPositivo extends ValueObject<number, ValueObjectConfig> {
  protected constructor(value: number, config?: ValueObjectConfig) {
    super(value, config)
  }

  /// Amount in cents (the canonical stored unit).
  get cents(): number {
    return this.value
  }

  static create(value: number, config?: ValueObjectConfig): ValorPositivo {
    const result = ValorPositivo.tryCreate(value, config)
    result.validator.throwsIfFailed()
    return result.instance
  }

  static tryCreate(value: number, config?: ValueObjectConfig): Result<ValorPositivo> {
    if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
      return Result.fail(CaixaError.VALOR_INVALIDO)
    }

    return Result.ok(new ValorPositivo(value, config))
  }
}
