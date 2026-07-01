import { Result, ValueObject, ValueObjectConfig } from '@repo/shared'

export type AttributeMap = Record<string, string>

/// Free-form key/value attributes for a variation (e.g. `{ size: "M", color:
/// "Blue" }`). Keys are trimmed non-empty strings (no duplicates after
/// trimming); values are trimmed non-empty strings. An empty map is allowed.
export class VariationAttributes extends ValueObject<AttributeMap, ValueObjectConfig> {
  private static readonly INVALID_ATTRIBUTES = 'INVALID_VARIATION_ATTRIBUTES'

  private constructor(value: AttributeMap, config?: ValueObjectConfig) {
    super(value, config)
  }

  get entries(): [string, string][] {
    return Object.entries(this.value)
  }

  public static create(value?: AttributeMap, config?: ValueObjectConfig): VariationAttributes {
    const result = VariationAttributes.tryCreate(value, config)
    result.validator.throwsIfFailed()
    return result.instance
  }

  public static tryCreate(
    value?: AttributeMap,
    config?: ValueObjectConfig,
  ): Result<VariationAttributes> {
    try {
      const source = value ?? {}

      if (typeof source !== 'object' || Array.isArray(source)) {
        throw new Error(VariationAttributes.INVALID_ATTRIBUTES)
      }

      const normalized: AttributeMap = {}
      for (const [rawKey, rawValue] of Object.entries(source)) {
        const key = typeof rawKey === 'string' ? rawKey.trim() : ''
        const val = typeof rawValue === 'string' ? rawValue.trim() : ''

        if (key.length === 0 || val.length === 0) {
          throw new Error(VariationAttributes.INVALID_ATTRIBUTES)
        }
        if (Object.prototype.hasOwnProperty.call(normalized, key)) {
          throw new Error(VariationAttributes.INVALID_ATTRIBUTES)
        }

        normalized[key] = val
      }

      return Result.ok(new VariationAttributes(normalized, config))
    } catch (error: any) {
      return Result.fail(error.message ?? VariationAttributes.INVALID_ATTRIBUTES)
    }
  }
}
