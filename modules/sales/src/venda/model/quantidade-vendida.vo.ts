import { PositiveInteger, Result, ValueObject, ValueObjectConfig } from '@repo/shared'
import { VendaError } from '../errors'

/// A sold quantity. MUST be a positive integer (`> 0`) per RF-VND-03.
export class QuantidadeVendida extends ValueObject<number, ValueObjectConfig> {
  private constructor(value: number, config?: ValueObjectConfig) {
    super(value, config)
  }

  static create(value: number, config?: ValueObjectConfig): QuantidadeVendida {
    const result = QuantidadeVendida.tryCreate(value, config)
    result.validator.throwsIfFailed()
    return result.instance
  }

  static tryCreate(value: number, config?: ValueObjectConfig): Result<QuantidadeVendida> {
    const positiveInteger = PositiveInteger.tryCreate(value, config)
    if (positiveInteger.isFailure) {
      return Result.fail(VendaError.INVALID_QUANTITY)
    }

    return Result.ok(new QuantidadeVendida(positiveInteger.instance.value, config))
  }
}
