/// Stable domain error codes for the category-management context. Returned via
/// `Result.fail(<CODE>)`; the API layer maps them to HTTP responses.
export const CategoryError = {
  CATEGORY_NOT_FOUND: 'CATEGORY_NOT_FOUND',
  CATEGORY_NAME_ALREADY_IN_USE: 'CATEGORY_NAME_ALREADY_IN_USE',
} as const

export type CategoryErrorCode = (typeof CategoryError)[keyof typeof CategoryError]
