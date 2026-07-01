import { Result, UseCase } from '@repo/shared'
import {
  AddVariationInputDTO,
  ProductDTO,
  toProductDTO,
} from '../dto/product.dto'
import { ProductError } from '../errors'
import { Variation } from '../model'
import { ProductsRepository } from '../provider'
import { UniqueBarcodeSpecification, UniqueSkuSpecification } from '../service'

/// Adds a variation to an existing product, enforcing SKU/barcode uniqueness
/// and price > 0 (RF-CAT-03, RF-CAT-04, RF-CAT-05).
export class AddVariation implements UseCase<AddVariationInputDTO, ProductDTO> {
  constructor(private readonly productsRepository: ProductsRepository) {}

  async execute(input: AddVariationInputDTO): Promise<Result<ProductDTO>> {
    const found = await this.productsRepository.findById(input.productId)
    if (found.isFailure) return Result.fail(ProductError.PRODUCT_NOT_FOUND)

    const added = found.instance.addVariation({
      sku: input.sku,
      barcode: input.barcode ?? null,
      attributes: input.attributes,
      price: input.price,
      minStock: input.minStock,
      active: input.active,
    })
    if (added.isFailure) return added.withFail

    const variations = added.instance.variations
    const newVariation = variations[variations.length - 1] as Variation

    const uniqueness = await this.ensureUniqueIdentifiers(newVariation)
    if (uniqueness.isFailure) return uniqueness.withFail

    const saved = await this.productsRepository.update(added.instance)
    if (saved.isFailure) return saved.withFail

    return Result.ok(toProductDTO(added.instance))
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
