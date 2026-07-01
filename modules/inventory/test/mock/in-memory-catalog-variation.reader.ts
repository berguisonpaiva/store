import { Result } from '@repo/shared'
import { Variation } from '@repo/catalog'
import { CatalogVariationReader } from '../../src/movimentacao'

export class InMemoryCatalogVariationReader implements CatalogVariationReader {
  private readonly variations = new Map<string, Variation>()

  register(variation: Variation): void {
    this.variations.set(variation.id, variation)
  }

  async findById(variationId: string): Promise<Result<Variation | null>> {
    return Result.ok(this.variations.get(variationId) ?? null)
  }

  all(): Variation[] {
    return [...this.variations.values()]
  }
}
