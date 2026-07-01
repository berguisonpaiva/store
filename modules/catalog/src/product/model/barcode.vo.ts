import { Result, ValueObject, ValueObjectConfig } from '@repo/shared'

/// Optional barcode (EAN/UPC/etc.). When present it must be a trimmed,
/// non-empty string; uniqueness (when present) is enforced by a domain
/// specification. Absence of a barcode is valid and skips the check.
export class Barcode extends ValueObject<string, ValueObjectConfig> {
  private static readonly INVALID_BARCODE = 'INVALID_BARCODE'

  private constructor(value: string, config?: ValueObjectConfig) {
    super(value, config)
  }

  public static create(value: string, config?: ValueObjectConfig): Barcode {
    const result = Barcode.tryCreate(value, config)
    result.validator.throwsIfFailed()
    return result.instance
  }

  public static format(value: string): string {
    return typeof value === 'string' ? value.trim() : ''
  }

  public static tryCreate(value: string, config?: ValueObjectConfig): Result<Barcode> {
    try {
      if (typeof value !== 'string') {
        throw new Error(Barcode.INVALID_BARCODE)
      }
      const normalized = Barcode.format(value)
      if (normalized.length === 0) {
        throw new Error(Barcode.INVALID_BARCODE)
      }

      return Result.ok(new Barcode(normalized, config))
    } catch (error: any) {
      return Result.fail(error.message ?? Barcode.INVALID_BARCODE)
    }
  }
}
