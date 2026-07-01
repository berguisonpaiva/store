import { Result, UseCase } from '@repo/shared'
import {
  FindProductByIdInputDTO,
  ProductDTO,
  toProductDTO,
} from '../dto/product.dto'
import { ProductError } from '../errors'
import { ProductsRepository } from '../provider'

/// Returns a single product projection (with its variations) or
/// `PRODUCT_NOT_FOUND`.
export class FindProductById implements UseCase<FindProductByIdInputDTO, ProductDTO> {
  constructor(private readonly productsRepository: ProductsRepository) {}

  async execute(input: FindProductByIdInputDTO): Promise<Result<ProductDTO>> {
    const found = await this.productsRepository.findById(input.id)
    if (found.isFailure) return Result.fail(ProductError.PRODUCT_NOT_FOUND)
    return Result.ok(toProductDTO(found.instance))
  }
}
