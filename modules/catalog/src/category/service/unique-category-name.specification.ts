import { Result } from '@repo/shared'
import { CategoryError } from '../errors'
import { Category } from '../model'

/// Pure specification: a category name is unique unless it belongs to a
/// *different* category. The use case supplies the lookup result; the rule is
/// decided here, never by a database unique index.
export class UniqueCategoryNameSpecification {
  static ensureUnique(existing: Category | null, selfId?: string): Result<void> {
    if (existing && existing.id !== selfId) {
      return Result.fail(CategoryError.CATEGORY_NAME_ALREADY_IN_USE)
    }
    return Result.ok()
  }
}
