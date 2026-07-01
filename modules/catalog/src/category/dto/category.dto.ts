import { Category } from '../model'

/// Public projection of a category. Never leaks the entity or ORM rows.
export type CategoryDTO = {
  id: string
  name: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export type CreateCategoryInputDTO = {
  name: string
  active?: boolean
}

export type UpdateCategoryInputDTO = {
  id: string
  name?: string
}

export type SetCategoryActiveInputDTO = {
  id: string
}

export type ListCategoriesFilterDTO = {
  active?: boolean
}

export function toCategoryDTO(category: Category): CategoryDTO {
  return {
    id: category.id,
    name: category.name,
    active: category.active,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  }
}
