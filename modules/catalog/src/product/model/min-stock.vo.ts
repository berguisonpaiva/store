import { Result, ValueObject, ValueObjectConfig } from '@repo/shared'

/// Minimum stock level for a variation. Integer >= 0, default 0. The value is
/// the source of truth that the future inventory module will read.
export class MinStock extends ValueObject<number, ValueObjectConfig> {
  private static readonly INVALID_MIN_STOCK = 'INVALID_MIN_STOCK'
  static readonly DEFAULT = 0

  private constructor(value: number, config?: ValueObjectConfig) {
    super(value, config)
  }

  public static create(value?: number, config?: ValueObjectConfig): MinStock {
    const result = MinStock.tryCreate(value, config)
    result.validator.throwsIfFailed()
    return result.instance
  }

  public static tryCreate(value?: number, config?: ValueObjectConfig): Result<MinStock> {
    try {
      const resolved = value ?? MinStock.DEFAULT

      if (typeof resolved !== 'number' || !Number.isFinite(resolved)) {
        throw new Error(MinStock.INVALID_MIN_STOCK)
      }
      if (!Number.isInteger(resolved)) {
        throw new Error(MinStock.INVALID_MIN_STOCK)
      }
      if (resolved < 0) {
        throw new Error(MinStock.INVALID_MIN_STOCK)
      }

      return Result.ok(new MinStock(resolved, config))
    } catch (error: any) {
      return Result.fail(error.message ?? MinStock.INVALID_MIN_STOCK)
    }
  }
}
