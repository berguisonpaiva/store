import { Result } from '@repo/shared'
import { CategoryDTO, ListCategoriesFilterDTO } from '../dto/category.dto'

/// CQRS read port: category listing projection (for selection in product forms
/// and management). Kept separate from the command-side `CategoriesRepository`.
export interface CategoriesQuery {
  list(filter?: ListCategoriesFilterDTO): Promise<Result<CategoryDTO[]>>
}
