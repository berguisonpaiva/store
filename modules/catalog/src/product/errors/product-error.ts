/// Stable domain error codes for the product-catalog context. Returned via
/// `Result.fail(<CODE>)`; the API layer maps them to HTTP responses.
export const ProductError = {
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  VARIATION_NOT_FOUND: 'VARIATION_NOT_FOUND',
  SKU_ALREADY_IN_USE: 'SKU_ALREADY_IN_USE',
  BARCODE_ALREADY_IN_USE: 'BARCODE_ALREADY_IN_USE',
  PRODUCT_MUST_HAVE_VARIATION: 'PRODUCT_MUST_HAVE_VARIATION',
  INVALID_PRICE: 'INVALID_PRICE',
} as const

export type ProductErrorCode = (typeof ProductError)[keyof typeof ProductError]
