import { PositiveInteger, Result, ValueObject, ValueObjectConfig } from '@repo/shared'
import { EstoqueError } from '../errors'

export class QuantidadeMovimentada extends ValueObject<number, ValueObjectConfig> {
  private constructor(value: number, config?: ValueObjectConfig) {
    super(value, config)
  }

  static create(value: number, config?: ValueObjectConfig): QuantidadeMovimentada {
    const result = QuantidadeMovimentada.tryCreate(value, config)
    result.validator.throwsIfFailed()
    return result.instance
  }

  static tryCreate(value: number, config?: ValueObjectConfig): Result<QuantidadeMovimentada> {
    const positiveInteger = PositiveInteger.tryCreate(value, config)
    if (positiveInteger.isFailure) {
      return Result.fail(EstoqueError.QUANTIDADE_INVALIDA)
    }

    return Result.ok(new QuantidadeMovimentada(positiveInteger.instance.value, config))
  }
}
