import { Result } from '@repo/shared'
import { ProductError } from '../errors'
import { Product } from '../model'

/// Pure specification: a SKU is unique across all variations of all products.
/// The use case supplies the product currently owning that SKU (from
/// `findBySku`) or null. A match is allowed only when it is the *same*
/// variation being edited (`selfVariationId`); any other match — including a
/// different variation of the same product — fails. Decided here, never by a
/// database unique index.
export class UniqueSkuSpecification {
  static ensureUnique(
    owner: Product | null,
    sku: string,
    selfVariationId?: string,
  ): Result<void> {
    if (!owner) return Result.ok()

    const match = owner.variations.find((variation) => variation.sku === sku)
    if (match && match.id === selfVariationId) {
      return Result.ok()
    }

    return Result.fail(ProductError.SKU_ALREADY_IN_USE)
  }
}
