import { Result, UseCase } from '@repo/shared'
import { CategoriesRepository } from '../../category/provider'
import {
  ProductDTO,
  UpdateProductInputDTO,
  toProductDTO,
} from '../dto/product.dto'
import { ProductError } from '../errors'
import { ProductsRepository } from '../provider'

/// Edits a product's name/description/category. The product must exist and a
/// referenced category must exist (RF-CAT-01).
export class UpdateProduct implements UseCase<UpdateProductInputDTO, ProductDTO> {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly categoriesRepository: CategoriesRepository,
  ) {}

  async execute(input: UpdateProductInputDTO): Promise<Result<ProductDTO>> {
    const found = await this.productsRepository.findById(input.id)
    if (found.isFailure) return Result.fail(ProductError.PRODUCT_NOT_FOUND)
    const current = found.instance

    if (input.categoryId) {
      const category = await this.categoriesRepository.findById(input.categoryId)
      if (category.isFailure) return Result.fail(ProductError.CATEGORY_NOT_FOUND_FOR_PRODUCT)
    }

    const edited = current.editProfile({
      name: input.name,
      description: input.description,
      categoryId: input.categoryId,
    })
    if (edited.isFailure) return edited.withFail

    const saved = await this.productsRepository.update(edited.instance)
    if (saved.isFailure) return saved.withFail

    return Result.ok(toProductDTO(edited.instance))
  }
}
