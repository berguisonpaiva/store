import { Text } from '@repo/shared'

/// Category name. Trimmed, non-empty (RF-CAT-09). Uniqueness is enforced by a
/// domain specification using a repository read, not a database constraint.
export class CategoryName extends Text {
  protected static override readonly TOO_SHORT: string = 'CATEGORY_NAME_TOO_SHORT'
  protected static override readonly TOO_LONG: string = 'CATEGORY_NAME_TOO_LONG'

  protected static override readonly DEFAULT_MIN_LENGTH = 1
  protected static override readonly DEFAULT_MAX_LENGTH = 80
}
