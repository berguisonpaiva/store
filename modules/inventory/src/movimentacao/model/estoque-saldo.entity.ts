import { Variation } from '@repo/catalog'
import { Entity, EntityProps, Id, Result } from '@repo/shared'
import { Saldo } from './saldo.vo'

export interface EstoqueSaldoProps extends EntityProps {
  variacaoId: string
  saldoAtual: number
  estoqueMinimo: number
}

export interface CreateFromCatalogVariationOverrides {
  saldoAtual?: number
  estoqueMinimo?: number
}

export class EstoqueSaldo extends Entity<EstoqueSaldo, EstoqueSaldoProps> {
  private constructor(props: EstoqueSaldoProps) {
    super(props)
  }

  static create(props: EstoqueSaldoProps): EstoqueSaldo {
    const result = EstoqueSaldo.tryCreate(props)
    result.validator.throwsIfFailed()
    return result.instance
  }

  static tryCreate(props: EstoqueSaldoProps): Result<EstoqueSaldo> {
    const variacaoId = Id.required(props.variacaoId, { attribute: 'variacaoId' })
    const saldoAtual = Saldo.tryCreate(props.saldoAtual)
    const estoqueMinimo = Saldo.tryCreate(props.estoqueMinimo)

    const validated = Result.combine([variacaoId, saldoAtual, estoqueMinimo])
    if (validated.isFailure) {
      return validated.withFail
    }

    const [validVariacaoId, validSaldoAtual, validEstoqueMinimo] = validated.instance

    return Result.ok(
      new EstoqueSaldo({
        ...props,
        id: validVariacaoId.value,
        variacaoId: validVariacaoId.value,
        saldoAtual: validSaldoAtual.value,
        estoqueMinimo: validEstoqueMinimo.value,
      }),
    )
  }

  static createFromCatalogVariation(
    variation: Variation,
    overrides: CreateFromCatalogVariationOverrides = {},
  ): EstoqueSaldo {
    return EstoqueSaldo.create({
      id: variation.id,
      variacaoId: variation.id,
      saldoAtual: overrides.saldoAtual ?? 0,
      estoqueMinimo: overrides.estoqueMinimo ?? variation.minStock,
    })
  }

  get variacaoId(): string {
    return this.props.variacaoId
  }

  get saldoAtual(): number {
    return this.props.saldoAtual
  }

  get estoqueMinimo(): number {
    return this.props.estoqueMinimo
  }
}
