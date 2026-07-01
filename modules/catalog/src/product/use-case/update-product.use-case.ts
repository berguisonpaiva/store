import { Result, UseCase } from '@repo/shared'
import { CategoriesRepository } from '../../category/provider'
import {
  ProductDTO,
  UpdateProductInputDTO,
  toProductDTO,
} from '../dto/product.dto'
import { ProductError } from '../errors'
import { ProductsRepository } from '../provider'
import { ActiveCategorySpecification } from '../service'

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
      const found = await this.categoriesRepository.findById(input.categoryId)
      const category = found.isFailure ? null : found.instance
      const usable = ActiveCategorySpecification.ensureUsable(category)
      if (usable.isFailure) return usable.withFail
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
