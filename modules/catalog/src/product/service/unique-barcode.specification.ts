import { Result } from '@repo/shared'
import { ProductError } from '../errors'
import { Barcode, Product } from '../model'

/// Pure specification: a barcode is unique across all variations whenever it is
/// present. A missing barcode skips the check entirely. The use case supplies
/// the product currently owning that barcode (from `findByBarcode`) or null. A
/// match is allowed only when it is the *same* variation being edited
/// (`selfVariationId`). Decided here, never by the database.
export class UniqueBarcodeSpecification {
  static ensureUnique(
    barcode: string | null | undefined,
    owner: Product | null,
    selfVariationId?: string,
  ): Result<void> {
    if (barcode === null || barcode === undefined || barcode === '') {
      return Result.ok()
    }
    if (!owner) return Result.ok()

    const normalized = Barcode.format(barcode)
    const match = owner.variations.find((variation) => variation.barcode === normalized)
    if (match && match.id === selfVariationId) {
      return Result.ok()
    }

    return Result.fail(ProductError.BARCODE_ALREADY_IN_USE)
  }
}
