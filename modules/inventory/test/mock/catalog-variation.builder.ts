import { Variation } from '@repo/catalog'

export type BuildCatalogVariationInput = Partial<{
  id: string
  sku: string
  price: number
  minStock: number
  active: boolean
}>

export function buildCatalogVariation(input: BuildCatalogVariationInput = {}): Variation {
  return Variation.create({
    id: input.id ?? '11111111-1111-1111-1111-111111111111',
    sku: input.sku ?? 'SKU-EST-1',
    barcode: null,
    attributes: { color: 'Blue' },
    price: input.price ?? 1000,
    minStock: input.minStock ?? 0,
    active: input.active ?? true,
  })
}
