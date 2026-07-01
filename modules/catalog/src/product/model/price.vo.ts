import { Result, ValueObject, ValueObjectConfig } from '@repo/shared'

/// Money value object stored as an integer number of cents to avoid
/// floating-point drift. Strictly greater than zero (RF-CAT-05).
export class Price extends ValueObject<number, ValueObjectConfig> {
  private static readonly INVALID_PRICE = 'INVALID_PRICE'

  private constructor(value: number, config?: ValueObjectConfig) {
    super(value, config)
  }

  /// Amount in cents (the canonical stored unit).
  get cents(): number {
    return this.value
  }

  public static create(value: number, config?: ValueObjectConfig): Price {
    const result = Price.tryCreate(value, config)
    result.validator.throwsIfFailed()
    return result.instance
  }

  public static tryCreate(value: number, config?: ValueObjectConfig): Result<Price> {
    try {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error(Price.INVALID_PRICE)
      }
      if (!Number.isInteger(value)) {
        throw new Error(Price.INVALID_PRICE)
      }
      if (value <= 0) {
        throw new Error(Price.INVALID_PRICE)
      }

      return Result.ok(new Price(value, config))
    } catch (error: any) {
      return Result.fail(error.message ?? Price.INVALID_PRICE)
    }
  }
}
