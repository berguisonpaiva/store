import { Variation } from '@repo/catalog'
import { Result } from '@repo/shared'

export interface CatalogVariationReader {
  findById(variationId: string): Promise<Result<Variation | null>>
}
