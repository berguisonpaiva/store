import { Result, UseCase } from '@repo/shared'
import {
  CategoryDTO,
  CreateCategoryInputDTO,
  toCategoryDTO,
} from '../dto/category.dto'
import { Category, CategoryName } from '../model'
import { CategoriesRepository } from '../provider'
import { UniqueCategoryNameSpecification } from '../service'

/// Creates a category with a non-empty, unique name (RF-CAT-09). Uniqueness is
/// decided in the domain via a repository read, never by a database constraint.
export class CreateCategory implements UseCase<CreateCategoryInputDTO, CategoryDTO> {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async execute(input: CreateCategoryInputDTO): Promise<Result<CategoryDTO>> {
    const name = CategoryName.tryCreate(input.name)
    if (name.isFailure) return name.withFail

    const existing = await this.categoriesRepository.findByName(name.instance.value)
    if (existing.isFailure) return existing.withFail

    const unique = UniqueCategoryNameSpecification.ensureUnique(existing.instance)
    if (unique.isFailure) return unique.withFail

    const category = Category.tryCreate({
      name: name.instance.value,
      active: input.active ?? true,
    })
    if (category.isFailure) return category.withFail

    const saved = await this.categoriesRepository.create(category.instance)
    if (saved.isFailure) return saved.withFail

    return Result.ok(toCategoryDTO(category.instance))
  }
}
