import { Result, UseCase } from '@repo/shared'
import { CategoryDTO, ListCategoriesFilterDTO } from '../dto/category.dto'
import { CategoriesQuery } from '../provider'

/// Lists categories for selection in product forms and management (read side).
export class ListCategories
  implements UseCase<ListCategoriesFilterDTO | undefined, CategoryDTO[]>
{
  constructor(private readonly categoriesQuery: CategoriesQuery) {}

  async execute(input?: ListCategoriesFilterDTO): Promise<Result<CategoryDTO[]>> {
    return this.categoriesQuery.list(input)
  }
}
