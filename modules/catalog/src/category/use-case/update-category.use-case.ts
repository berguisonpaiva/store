import { Result, UseCase } from '@repo/shared'
import {
  CategoryDTO,
  UpdateCategoryInputDTO,
  toCategoryDTO,
} from '../dto/category.dto'
import { CategoryError } from '../errors'
import { CategoryName } from '../model'
import { CategoriesRepository } from '../provider'
import { UniqueCategoryNameSpecification } from '../service'

/// Renames a category to a unique name (RF-CAT-09). The category must exist.
export class UpdateCategory implements UseCase<UpdateCategoryInputDTO, CategoryDTO> {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async execute(input: UpdateCategoryInputDTO): Promise<Result<CategoryDTO>> {
    const found = await this.categoriesRepository.findById(input.id)
    if (found.isFailure) return Result.fail(CategoryError.CATEGORY_NOT_FOUND)
    const current = found.instance

    if (input.name === undefined) {
      return Result.ok(toCategoryDTO(current))
    }

    const name = CategoryName.tryCreate(input.name)
    if (name.isFailure) return name.withFail

    const existing = await this.categoriesRepository.findByName(name.instance.value)
    if (existing.isFailure) return existing.withFail

    const unique = UniqueCategoryNameSpecification.ensureUnique(existing.instance, current.id)
    if (unique.isFailure) return unique.withFail

    const renamed = current.rename(name.instance.value)
    if (renamed.isFailure) return renamed.withFail

    const saved = await this.categoriesRepository.update(renamed.instance)
    if (saved.isFailure) return saved.withFail

    return Result.ok(toCategoryDTO(renamed.instance))
  }
}
