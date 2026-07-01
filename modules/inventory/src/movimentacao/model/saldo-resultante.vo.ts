import { Result, ValueObjectConfig } from '@repo/shared'
import { Saldo } from './saldo.vo'

export class SaldoResultante extends Saldo {
  static create(value: number, config?: ValueObjectConfig): SaldoResultante {
    const result = SaldoResultante.tryCreate(value, config)
    result.validator.throwsIfFailed()
    return result.instance
  }

  static tryCreate(value: number, config?: ValueObjectConfig): Result<SaldoResultante> {
    const saldo = Saldo.tryCreate(value, config)
    if (saldo.isFailure) {
      return saldo.withFail
    }

    return Result.ok(new SaldoResultante(saldo.instance.value, config))
  }
}
