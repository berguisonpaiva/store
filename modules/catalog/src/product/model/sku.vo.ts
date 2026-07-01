import { Result, ValueObject, ValueObjectConfig } from '@repo/shared'

/// Stock keeping unit. Normalized to a trimmed, uppercase, non-empty string.
/// SKU uniqueness across all variations is enforced by a domain specification,
/// never by a database constraint.
export class Sku extends ValueObject<string, ValueObjectConfig> {
  private static readonly INVALID_SKU = 'INVALID_SKU'

  private constructor(value: string, config?: ValueObjectConfig) {
    super(value, config)
  }

  public static create(value: string, config?: ValueObjectConfig): Sku {
    const result = Sku.tryCreate(value, config)
    result.validator.throwsIfFailed()
    return result.instance
  }

  public static format(value: string): string {
    return typeof value === 'string' ? value.trim().toUpperCase() : ''
  }

  public static tryCreate(value: string, config?: ValueObjectConfig): Result<Sku> {
    try {
      if (typeof value !== 'string') {
        throw new Error(Sku.INVALID_SKU)
      }
      const normalized = Sku.format(value)
      if (normalized.length === 0) {
        throw new Error(Sku.INVALID_SKU)
      }

      return Result.ok(new Sku(normalized, config))
    } catch (error: any) {
      return Result.fail(error.message ?? Sku.INVALID_SKU)
    }
  }
}
