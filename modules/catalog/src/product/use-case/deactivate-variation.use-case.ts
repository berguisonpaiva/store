import { Result, UseCase } from '@repo/shared'
import {
  ProductDTO,
  SetVariationActiveInputDTO,
  toProductDTO,
} from '../dto/product.dto'
import { ProductError } from '../errors'
import { ProductsRepository } from '../provider'

/// Deactivates a variation on an existing product (RF-CAT-06).
export class DeactivateVariation implements UseCase<SetVariationActiveInputDTO, ProductDTO> {
  constructor(private readonly productsRepository: ProductsRepository) {}

  async execute(input: SetVariationActiveInputDTO): Promise<Result<ProductDTO>> {
    const found = await this.productsRepository.findById(input.productId)
    if (found.isFailure) return Result.fail(ProductError.PRODUCT_NOT_FOUND)

    const deactivated = found.instance.deactivateVariation(input.variationId)
    if (deactivated.isFailure) return deactivated.withFail

    const saved = await this.productsRepository.update(deactivated.instance)
    if (saved.isFailure) return saved.withFail

    return Result.ok(toProductDTO(deactivated.instance))
  }
}
