import { Entity, EntityProps, Result } from '@repo/shared'
import { Barcode } from './barcode.vo'
import { MinStock } from './min-stock.vo'
import { Price } from './price.vo'
import { Sku } from './sku.vo'
import { AttributeMap, VariationAttributes } from './variation-attributes.vo'

export interface VariationProps extends EntityProps {
  sku: string
  barcode?: string | null
  attributes: AttributeMap
  price: number
  minStock: number
  active: boolean
}

export interface VariationEditInput {
  sku?: string
  barcode?: string | null
  attributes?: AttributeMap
  price?: number
  minStock?: number
}

/// Variation is an entity owned by the `Product` aggregate (not its own
/// aggregate root). All field validation lives in the value objects +
/// `tryCreate`; SKU/barcode global uniqueness is enforced by domain
/// specifications at the use-case level.
export class Variation extends Entity<Variation, VariationProps> {
  private constructor(props: VariationProps) {
    super(props)
  }

  get sku(): string {
    return this.props.sku
  }

  get barcode(): string | null {
    return this.props.barcode ?? null
  }

  get attributes(): AttributeMap {
    return this.props.attributes
  }

  get price(): number {
    return this.props.price
  }

  get minStock(): number {
    return this.props.minStock
  }

  get active(): boolean {
    return this.props.active
  }

  static create(props: VariationProps): Variation {
    const result = Variation.tryCreate(props)
    result.validator.throwsIfFailed()
    return result.instance
  }

  static tryCreate(props: VariationProps): Result<Variation> {
    const sku = Sku.tryCreate(props.sku)
    const price = Price.tryCreate(props.price)
    const minStock = MinStock.tryCreate(props.minStock)
    const attributes = VariationAttributes.tryCreate(props.attributes)

    const validated = Result.combine([sku, price, minStock, attributes])
    if (validated.isFailure) {
      return validated.withFail
    }

    const [validSku, validPrice, validMinStock, validAttributes] = validated.instance

    let normalizedBarcode: string | null = null
    if (props.barcode !== undefined && props.barcode !== null && props.barcode !== '') {
      const barcode = Barcode.tryCreate(props.barcode)
      if (barcode.isFailure) {
        return barcode.withFail
      }
      normalizedBarcode = barcode.instance.value
    }

    return Result.ok(
      new Variation({
        ...props,
        sku: validSku.value,
        barcode: normalizedBarcode,
        attributes: validAttributes.value,
        price: validPrice.value,
        minStock: validMinStock.value,
        active: props.active ?? true,
      }),
    )
  }

  /// Edits variation fields; each provided field is re-validated. Rebuilt via
  /// `tryCreate` so the `attributes` map is replaced wholesale (the framework's
  /// `cloneWith` deep-merges nested objects, which would keep removed keys).
  edit(input: VariationEditInput): Result<Variation> {
    return Variation.tryCreate({
      ...this.props,
      sku: input.sku ?? this.props.sku,
      barcode: input.barcode !== undefined ? input.barcode : this.props.barcode,
      attributes: input.attributes ?? this.props.attributes,
      price: input.price ?? this.props.price,
      minStock: input.minStock ?? this.props.minStock,
    })
  }

  activate(): Result<Variation> {
    return this.cloneWith({ active: true })
  }

  deactivate(): Result<Variation> {
    return this.cloneWith({ active: false })
  }
}
