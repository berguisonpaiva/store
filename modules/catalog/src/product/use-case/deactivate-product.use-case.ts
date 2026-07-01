import { Result, UseCase } from '@repo/shared'
import {
  ProductDTO,
  SetProductActiveInputDTO,
  toProductDTO,
} from '../dto/product.dto'
import { ProductError } from '../errors'
import { ProductsRepository } from '../provider'

/// Deactivates a product (RF-CAT-06). No deletion exists — only activation
/// state changes, preserving sales history.
export class DeactivateProduct implements UseCase<SetProductActiveInputDTO, ProductDTO> {
  constructor(private readonly productsRepository: ProductsRepository) {}

  async execute(input: SetProductActiveInputDTO): Promise<Result<ProductDTO>> {
    const found = await this.productsRepository.findById(input.id)
    if (found.isFailure) return Result.fail(ProductError.PRODUCT_NOT_FOUND)

    const deactivated = found.instance.deactivate()
    if (deactivated.isFailure) return deactivated.withFail

    const saved = await this.productsRepository.update(deactivated.instance)
    if (saved.isFailure) return saved.withFail

    return Result.ok(toProductDTO(deactivated.instance))
  }
}
