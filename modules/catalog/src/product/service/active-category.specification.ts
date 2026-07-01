import { Result } from '@repo/shared'
import { CategoryError } from '../../category/errors'
import { Category } from '../../category/model'

/// Pure specification: a category referenced by a product must exist and be
/// active (RN02/RN03). The use case supplies the lookup result (or null when the
/// category could not be found); the rule is decided here. Products without a
/// category never reach this check (categoryId is optional).
export class ActiveCategorySpecification {
  static ensureUsable(category: Category | null): Result<void> {
    if (!category) {
      return Result.fail(CategoryError.CATEGORY_NOT_FOUND)
    }
    if (!category.active) {
      return Result.fail(CategoryError.CATEGORY_INACTIVE)
    }
    return Result.ok()
  }
}
