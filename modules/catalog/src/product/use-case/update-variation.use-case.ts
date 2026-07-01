import { Result, UseCase } from '@repo/shared'
import {
  ProductDTO,
  UpdateVariationInputDTO,
  toProductDTO,
} from '../dto/product.dto'
import { ProductError } from '../errors'
import { Variation } from '../model'
import { ProductsRepository } from '../provider'
import { UniqueBarcodeSpecification, UniqueSkuSpecification } from '../service'

/// Edits a variation's SKU/barcode/attributes/price/minStock on an existing
/// product, enforcing SKU/barcode uniqueness and price > 0 (RF-CAT-03,04,05).
export class UpdateVariation implements UseCase<UpdateVariationInputDTO, ProductDTO> {
  constructor(private readonly productsRepository: ProductsRepository) {}

  async execute(input: UpdateVariationInputDTO): Promise<Result<ProductDTO>> {
    const found = await this.productsRepository.findById(input.productId)
    if (found.isFailure) return Result.fail(ProductError.PRODUCT_NOT_FOUND)

    const updated = found.instance.updateVariation(input.variationId, {
      sku: input.sku,
      barcode: input.barcode,
      attributes: input.attributes,
      price: input.price,
      minStock: input.minStock,
    })
    if (updated.isFailure) return updated.withFail

    const editedVariation = updated.instance.variation(input.variationId) as Variation

    const uniqueness = await this.ensureUniqueIdentifiers(editedVariation)
    if (uniqueness.isFailure) return uniqueness.withFail

    const saved = await this.productsRepository.update(updated.instance)
    if (saved.isFailure) return saved.withFail

    return Result.ok(toProductDTO(updated.instance))
  }

  private async ensureUniqueIdentifiers(variation: Variation): Promise<Result<void>> {
    const bySku = await this.productsRepository.findBySku(variation.sku)
    if (bySku.isFailure) return bySku.withFail
    const uniqueSku = UniqueSkuSpecification.ensureUnique(
      bySku.instance,
      variation.sku,
      variation.id,
    )
    if (uniqueSku.isFailure) return uniqueSku.withFail

    if (variation.barcode) {
      const byBarcode = await this.productsRepository.findByBarcode(variation.barcode)
      if (byBarcode.isFailure) return byBarcode.withFail
      const uniqueBarcode = UniqueBarcodeSpecification.ensureUnique(
        variation.barcode,
        byBarcode.instance,
        variation.id,
      )
      if (uniqueBarcode.isFailure) return uniqueBarcode.withFail
    }

    return Result.ok()
  }
}
