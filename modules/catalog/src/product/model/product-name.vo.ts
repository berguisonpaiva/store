import { Text, TextConfig } from '@repo/shared'

/// Product display name. Trimmed, at least 2 characters (RF-CAT-01).
export class ProductName extends Text {
  protected static override readonly TOO_SHORT: string = 'PRODUCT_NAME_TOO_SHORT'
  protected static override readonly TOO_LONG: string = 'PRODUCT_NAME_TOO_LONG'

  protected static override readonly DEFAULT_MIN_LENGTH = 2
  protected static override readonly DEFAULT_MAX_LENGTH = 120
}

export type ProductNameConfig = TextConfig
