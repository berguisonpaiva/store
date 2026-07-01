import { Result, UseCase } from '@repo/shared'
import {
  CategoryDTO,
  SetCategoryActiveInputDTO,
  toCategoryDTO,
} from '../dto/category.dto'
import { CategoryError } from '../errors'
import { CategoriesRepository } from '../provider'

/// Deactivates a category (RF-CAT-09).
export class DeactivateCategory implements UseCase<SetCategoryActiveInputDTO, CategoryDTO> {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async execute(input: SetCategoryActiveInputDTO): Promise<Result<CategoryDTO>> {
    const found = await this.categoriesRepository.findById(input.id)
    if (found.isFailure) return Result.fail(CategoryError.CATEGORY_NOT_FOUND)

    const deactivated = found.instance.deactivate()
    if (deactivated.isFailure) return deactivated.withFail

    const saved = await this.categoriesRepository.update(deactivated.instance)
    if (saved.isFailure) return saved.withFail

    return Result.ok(toCategoryDTO(deactivated.instance))
  }
}
