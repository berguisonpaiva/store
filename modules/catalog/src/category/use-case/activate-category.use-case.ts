import { Result, UseCase } from '@repo/shared'
import {
  CategoryDTO,
  SetCategoryActiveInputDTO,
  toCategoryDTO,
} from '../dto/category.dto'
import { CategoryError } from '../errors'
import { CategoriesRepository } from '../provider'

/// Activates a category (RF-CAT-09).
export class ActivateCategory implements UseCase<SetCategoryActiveInputDTO, CategoryDTO> {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async execute(input: SetCategoryActiveInputDTO): Promise<Result<CategoryDTO>> {
    const found = await this.categoriesRepository.findById(input.id)
    if (found.isFailure) return Result.fail(CategoryError.CATEGORY_NOT_FOUND)

    const activated = found.instance.activate()
    if (activated.isFailure) return activated.withFail

    const saved = await this.categoriesRepository.update(activated.instance)
    if (saved.isFailure) return saved.withFail

    return Result.ok(toCategoryDTO(activated.instance))
  }
}
