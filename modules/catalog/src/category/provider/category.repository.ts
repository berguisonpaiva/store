import {
  CreateRepository,
  FindByIdRepository,
  Result,
  UpdateRepository,
} from '@repo/shared'
import { Category } from '../model'

/// Persistence contract for the `Category` aggregate. Composed from the shared
/// create/update/findById ports (deliberately NOT `CrudRepository` — categories
/// are deactivated, never deleted). The `findByName` read feeds the unique-name
/// specification; the rule itself lives in the domain.
export interface CategoriesRepository
  extends CreateRepository<Category>,
    UpdateRepository<Category>,
    FindByIdRepository<Category> {
  /// Returns the category with the given name, or `ok(null)` when none exists.
  findByName(name: string): Promise<Result<Category | null>>
}
