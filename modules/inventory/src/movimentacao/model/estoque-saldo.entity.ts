import { Variation } from '@repo/catalog'
import { Entity, EntityProps, Id, Result } from '@repo/shared'
import { EstoqueError } from '../errors'
import { Saldo } from './saldo.vo'

export interface EstoqueSaldoProps extends EntityProps {
  variacaoId: string
  saldoAtual: number
  quantidadeReservada: number
  estoqueMinimo: number
}

export interface CreateFromCatalogVariationOverrides {
  saldoAtual?: number
  quantidadeReservada?: number
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
    const quantidadeReservada = Saldo.tryCreate(props.quantidadeReservada)
    const estoqueMinimo = Saldo.tryCreate(props.estoqueMinimo)

    const validated = Result.combine([variacaoId, saldoAtual, quantidadeReservada, estoqueMinimo])
    if (validated.isFailure) {
      return validated.withFail
    }

    const [validVariacaoId, validSaldoAtual, validQuantidadeReservada, validEstoqueMinimo] = validated.instance
    if (validSaldoAtual.value - validQuantidadeReservada.value < 0) {
      return Result.fail(EstoqueError.ESTOQUE_INSUFICIENTE)
    }

    return Result.ok(
      new EstoqueSaldo({
        ...props,
        id: validVariacaoId.value,
        variacaoId: validVariacaoId.value,
        saldoAtual: validSaldoAtual.value,
        quantidadeReservada: validQuantidadeReservada.value,
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
      quantidadeReservada: overrides.quantidadeReservada ?? 0,
      estoqueMinimo: overrides.estoqueMinimo ?? variation.minStock,
    })
  }

  get variacaoId(): string {
    return this.props.variacaoId
  }

  get saldoAtual(): number {
    return this.props.saldoAtual
  }

  get quantidadeReservada(): number {
    return this.props.quantidadeReservada
  }

  get estoqueMinimo(): number {
    return this.props.estoqueMinimo
  }

  get saldoDisponivel(): number {
    return this.props.saldoAtual - this.props.quantidadeReservada
  }
}
