/// Stable domain error codes for the category-management context. Returned via
/// `Result.fail(<CODE>)`; the API layer maps them to HTTP responses.
export const CategoryError = {
  CATEGORY_NOT_FOUND: 'CATEGORY_NOT_FOUND',
  CATEGORY_ALREADY_EXISTS: 'CATEGORY_ALREADY_EXISTS',
  CATEGORY_INACTIVE: 'CATEGORY_INACTIVE',
} as const

export type CategoryErrorCode = (typeof CategoryError)[keyof typeof CategoryError]
