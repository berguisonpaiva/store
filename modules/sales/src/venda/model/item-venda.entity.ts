import { Entity, EntityProps, Id, Result } from '@repo/shared'
import { VendaError } from '../errors'
import { Dinheiro } from './dinheiro.vo'
import { QuantidadeVendida } from './quantidade-vendida.vo'

export interface ItemVendaProps extends EntityProps {
  variacaoId: string
  quantidade: number
  /// Price snapshot (cents) captured at add-item time (RF-VND-03). Never re-read.
  precoUnitario: number
  total: number
}

export interface CreateItemVendaProps extends EntityProps {
  variacaoId: string
  quantidade: number
  precoUnitario: number
}

/// A sale line. Owned by the `Venda` aggregate — never persisted standalone.
export class ItemVenda extends Entity<ItemVenda, ItemVendaProps> {
  private constructor(props: ItemVendaProps) {
    super(props)
  }

  static create(props: CreateItemVendaProps): ItemVenda {
    const result = ItemVenda.tryCreate(props)
    result.validator.throwsIfFailed()
    return result.instance
  }

  static tryCreate(props: CreateItemVendaProps): Result<ItemVenda> {
    const variacaoId = Id.tryCreate(props.variacaoId, { attribute: 'variacaoId' })
    const quantidade = QuantidadeVendida.tryCreate(props.quantidade)
    const precoUnitario = Dinheiro.tryCreate(props.precoUnitario, VendaError.INVALID_PRICE)

    const validated = Result.combine([variacaoId, quantidade, precoUnitario])
    if (validated.isFailure) {
      return validated.withFail
    }

    const [validVariacaoId, validQuantidade, validPreco] = validated.instance
    const total = validPreco.multiply(validQuantidade.value)

    return Result.ok(
      new ItemVenda({
        id: props.id,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
        variacaoId: validVariacaoId.value,
        quantidade: validQuantidade.value,
        precoUnitario: validPreco.cents,
        total: total.cents,
      }),
    )
  }

  /// Returns a new line with the given quantity, keeping the price snapshot and
  /// recomputing the line total. Fails with `INVALID_QUANTITY` for non-positive input.
  withQuantidade(quantidade: number): Result<ItemVenda> {
    return ItemVenda.tryCreate({
      id: this.id,
      createdAt: this.createdAt,
      variacaoId: this.props.variacaoId,
      quantidade,
      precoUnitario: this.props.precoUnitario,
    })
  }

  get variacaoId(): string {
    return this.props.variacaoId
  }

  get quantidade(): number {
    return this.props.quantidade
  }

  get precoUnitario(): number {
    return this.props.precoUnitario
  }

  get total(): number {
    return this.props.total
  }
}
