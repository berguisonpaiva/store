import { Result, TransactionContext } from '@repo/shared'
import {
  CategoriesQuery,
  CategoriesRepository,
  Category,
  CategoryDTO,
  ListCategoriesFilterDTO,
  toCategoryDTO,
} from '../../src/category'

/// Reference in-memory implementation used by use-case tests. Implements both
/// the command (`CategoriesRepository`) and read (`CategoriesQuery`) ports.
export class InMemoryCategoryRepository implements CategoriesRepository, CategoriesQuery {
  readonly items = new Map<string, Category>()

  async create(entity: Category, _tx?: TransactionContext): Promise<Result<void>> {
    this.items.set(entity.id, entity)
    return Result.ok()
  }

  async update(entity: Category, _tx?: TransactionContext): Promise<Result<void>> {
    this.items.set(entity.id, entity)
    return Result.ok()
  }

  async findById(id: string): Promise<Result<Category>> {
    const entity = this.items.get(id)
    if (!entity) {
      return Result.fail('ENTITY_NOT_FOUND')
    }
    return Result.ok(entity)
  }

  async findByName(name: string): Promise<Result<Category | null>> {
    const normalized = name.trim()
    const found = [...this.items.values()].find((category) => category.name === normalized)
    return Result.ok(found ?? null)
  }

  async list(filter?: ListCategoriesFilterDTO): Promise<Result<CategoryDTO[]>> {
    let rows = [...this.items.values()]
    if (filter?.active !== undefined) {
      rows = rows.filter((category) => category.active === filter.active)
    }
    return Result.ok(rows.map(toCategoryDTO))
  }
}
