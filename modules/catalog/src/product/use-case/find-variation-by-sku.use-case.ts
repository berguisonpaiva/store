import { Result, UseCase } from '@repo/shared'
import {
  FindVariationBySkuInputDTO,
  VariationLookupDTO,
  toVariationLookupDTO,
} from '../dto/product.dto'
import { ProductError } from '../errors'
import { Sku } from '../model'
import { ProductsRepository } from '../provider'

/// Retrieves a variation by exact SKU, returning it with its product context
/// for the PDV scan flow (RF-CAT-07). Returns `VARIATION_NOT_FOUND` when no
/// variation matches.
export class FindVariationBySku
  implements UseCase<FindVariationBySkuInputDTO, VariationLookupDTO>
{
  constructor(private readonly productsRepository: ProductsRepository) {}

  async execute(input: FindVariationBySkuInputDTO): Promise<Result<VariationLookupDTO>> {
    const sku = Sku.tryCreate(input.sku)
    if (sku.isFailure) return Result.fail(ProductError.VARIATION_NOT_FOUND)

    const found = await this.productsRepository.findBySku(sku.instance.value)
    if (found.isFailure) return found.withFail
    if (!found.instance) return Result.fail(ProductError.VARIATION_NOT_FOUND)

    const product = found.instance
    const variation = product.variations.find((v) => v.sku === sku.instance.value)
    if (!variation) return Result.fail(ProductError.VARIATION_NOT_FOUND)

    return Result.ok(toVariationLookupDTO(product, variation))
  }
}
