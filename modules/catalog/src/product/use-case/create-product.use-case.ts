import { Result, UseCase } from '@repo/shared'
import { CategoriesRepository } from '../../category/provider'
import {
  CreateProductInputDTO,
  ProductDTO,
  toProductDTO,
} from '../dto/product.dto'
import { ProductError } from '../errors'
import { Product } from '../model'
import { ProductsRepository } from '../provider'
import { UniqueBarcodeSpecification, UniqueSkuSpecification } from '../service'

/// Creates a product with at least one variation. Category existence, the
/// ≥1-variation invariant, price > 0 and SKU/barcode uniqueness are all
/// enforced in the domain before persisting (RF-CAT-01..05).
export class CreateProduct implements UseCase<CreateProductInputDTO, ProductDTO> {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly categoriesRepository: CategoriesRepository,
  ) {}

  async execute(input: CreateProductInputDTO): Promise<Result<ProductDTO>> {
    if (input.categoryId) {
      const category = await this.categoriesRepository.findById(input.categoryId)
      if (category.isFailure) return Result.fail(ProductError.CATEGORY_NOT_FOUND_FOR_PRODUCT)
    }

    const product = Product.tryCreate({
      name: input.name,
      description: input.description ?? null,
      categoryId: input.categoryId ?? null,
      active: input.active ?? true,
      variations: input.variations.map((variation) => ({
        sku: variation.sku,
        barcode: variation.barcode ?? null,
        attributes: variation.attributes ?? {},
        price: variation.price,
        minStock: variation.minStock,
        active: variation.active ?? true,
      })),
    })
    if (product.isFailure) return product.withFail

    const seenSkus = new Set<string>()
    const seenBarcodes = new Set<string>()
    for (const variation of product.instance.variations) {
      if (seenSkus.has(variation.sku)) {
        return Result.fail(ProductError.SKU_ALREADY_IN_USE)
      }
      seenSkus.add(variation.sku)

      if (variation.barcode) {
        if (seenBarcodes.has(variation.barcode)) {
          return Result.fail(ProductError.BARCODE_ALREADY_IN_USE)
        }
        seenBarcodes.add(variation.barcode)
      }

      const uniqueness = await this.ensureUniqueIdentifiers(variation.sku, variation.barcode)
      if (uniqueness.isFailure) return uniqueness.withFail
    }

    const saved = await this.productsRepository.create(product.instance)
    if (saved.isFailure) return saved.withFail

    return Result.ok(toProductDTO(product.instance))
  }

  /// Checks a brand-new variation's SKU/barcode against every persisted
  /// variation. No `selfVariationId` is passed because the variation does not
  /// exist yet, so any existing match is a conflict.
  private async ensureUniqueIdentifiers(
    sku: string,
    barcode: string | null,
  ): Promise<Result<void>> {
    const bySku = await this.productsRepository.findBySku(sku)
    if (bySku.isFailure) return bySku.withFail
    const uniqueSku = UniqueSkuSpecification.ensureUnique(bySku.instance, sku)
    if (uniqueSku.isFailure) return uniqueSku.withFail

    if (barcode) {
      const byBarcode = await this.productsRepository.findByBarcode(barcode)
      if (byBarcode.isFailure) return byBarcode.withFail
      const uniqueBarcode = UniqueBarcodeSpecification.ensureUnique(barcode, byBarcode.instance)
      if (uniqueBarcode.isFailure) return uniqueBarcode.withFail
    }

    return Result.ok()
  }
}
