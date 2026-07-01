import { Description, Entity, EntityProps, Id, Result, Text } from '@repo/shared'
import { ProductError } from '../errors'
import { ProductName } from './product-name.vo'
import { AttributeMap } from './variation-attributes.vo'
import { Variation, VariationEditInput, VariationProps } from './variation.entity'

export interface ProductProps extends EntityProps {
  name: string
  description?: string | null
  categoryId?: string | null
  active: boolean
  /// Stored as plain normalized props (never `Variation` instances) so the
  /// framework's `structuredClone`-based `cloneWith` stays safe.
  variations: VariationProps[]
}

export interface ProductEditInput {
  name?: string
  description?: string | null
  categoryId?: string | null
}

export interface AddVariationInput {
  sku: string
  barcode?: string | null
  attributes?: AttributeMap
  price: number
  minStock?: number
  active?: boolean
}

/// Product aggregate root. Owns its `Variation` entities and guarantees the
/// "at least one variation" invariant (RF-CAT-02). All field validation lives
/// in the value objects + `tryCreate`; cross-product SKU/barcode uniqueness is
/// enforced by domain specifications at the use-case level. There is no
/// deletion — products and variations are deactivated only (RF-CAT-06).
export class Product extends Entity<Product, ProductProps> {
  private constructor(props: ProductProps) {
    super(props)
  }

  get name(): string {
    return this.props.name
  }

  get description(): string | null {
    return this.props.description ?? null
  }

  get categoryId(): string | null {
    return this.props.categoryId ?? null
  }

  get active(): boolean {
    return this.props.active
  }

  /// Hydrated `Variation` entities (rebuilt from the stored props each access).
  get variations(): Variation[] {
    return this.props.variations.map((props) => Variation.create(props))
  }

  variation(variationId: string): Variation | null {
    const found = this.props.variations.find((v) => v.id === variationId)
    return found ? Variation.create(found) : null
  }

  static create(props: ProductProps): Product {
    const result = Product.tryCreate(props)
    result.validator.throwsIfFailed()
    return result.instance
  }

  static tryCreate(props: ProductProps): Result<Product> {
    const name = ProductName.tryCreate(props.name)
    if (name.isFailure) return name.withFail

    let normalizedDescription: string | null = null
    if (props.description !== undefined && props.description !== null && props.description !== '') {
      const description = Description.tryCreate(props.description, { minLength: 1, maxLength: 2000 })
      if (description.isFailure) return description.withFail
      normalizedDescription = (description.instance as Text).value
    }

    let normalizedCategoryId: string | null = null
    if (props.categoryId !== undefined && props.categoryId !== null && props.categoryId !== '') {
      const categoryId = Id.tryCreate(props.categoryId)
      if (categoryId.isFailure) return categoryId.withFail
      normalizedCategoryId = categoryId.instance.value
    }

    const variationsResult = Product.validateVariations(props.variations)
    if (variationsResult.isFailure) return variationsResult.withFail

    return Result.ok(
      new Product({
        ...props,
        name: name.instance.value,
        description: normalizedDescription,
        categoryId: normalizedCategoryId,
        active: props.active ?? true,
        variations: variationsResult.instance,
      }),
    )
  }

  /// Validates the "at least one variation" invariant and every variation,
  /// returning the normalized variation props.
  private static validateVariations(variations: VariationProps[]): Result<VariationProps[]> {
    if (!Array.isArray(variations) || variations.length === 0) {
      return Result.fail(ProductError.PRODUCT_MUST_HAVE_VARIATION)
    }

    const normalized: VariationProps[] = []
    for (const props of variations) {
      const variation = Variation.tryCreate(props)
      if (variation.isFailure) return variation.withFail
      normalized.push(variation.instance.props)
    }

    return Result.ok(normalized)
  }

  activate(): Result<Product> {
    return this.cloneWith({ active: true })
  }

  deactivate(): Result<Product> {
    return this.cloneWith({ active: false })
  }

  /// Edits the product profile (name/description/category). Each provided field
  /// is re-validated by `tryCreate`.
  editProfile(input: ProductEditInput): Result<Product> {
    return this.cloneWith({
      name: input.name ?? this.props.name,
      description: input.description !== undefined ? input.description : this.props.description,
      categoryId: input.categoryId !== undefined ? input.categoryId : this.props.categoryId,
    })
  }

  /// Adds a new variation, re-validating the whole aggregate.
  addVariation(input: AddVariationInput): Result<Product> {
    const variation = Variation.tryCreate({
      sku: input.sku,
      barcode: input.barcode ?? null,
      attributes: input.attributes ?? {},
      price: input.price,
      minStock: input.minStock,
      active: input.active ?? true,
    })
    if (variation.isFailure) return variation.withFail

    return this.replaceVariations([...this.props.variations, variation.instance.props])
  }

  /// Edits an existing variation by id.
  updateVariation(variationId: string, input: VariationEditInput): Result<Product> {
    const current = this.variation(variationId)
    if (!current) return Result.fail(ProductError.VARIATION_NOT_FOUND)

    const edited = current.edit(input)
    if (edited.isFailure) return edited.withFail

    return this.replaceVariation(variationId, edited.instance.props)
  }

  activateVariation(variationId: string): Result<Product> {
    return this.setVariationActive(variationId, true)
  }

  deactivateVariation(variationId: string): Result<Product> {
    return this.setVariationActive(variationId, false)
  }

  private setVariationActive(variationId: string, active: boolean): Result<Product> {
    const current = this.variation(variationId)
    if (!current) return Result.fail(ProductError.VARIATION_NOT_FOUND)

    const next = active ? current.activate() : current.deactivate()
    if (next.isFailure) return next.withFail

    return this.replaceVariation(variationId, next.instance.props)
  }

  private replaceVariation(variationId: string, props: VariationProps): Result<Product> {
    const variations = this.props.variations.map((v) => (v.id === variationId ? props : v))
    return this.replaceVariations(variations)
  }

  private replaceVariations(variations: VariationProps[]): Result<Product> {
    return this.cloneWith({ variations })
  }
}
