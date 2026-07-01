import { Product, ProductProps, VariationProps } from '../../src/product'

/// Builds a valid `VariationProps` for tests. Override any field as needed.
export function buildVariationProps(overrides: Partial<VariationProps> = {}): VariationProps {
  return {
    sku: 'SKU-1',
    barcode: null,
    attributes: {},
    price: 1000,
    minStock: 0,
    active: true,
    ...overrides,
  }
}

/// Builds a valid `Product` (one variation) for tests. Override any prop.
export function buildProduct(overrides: Partial<ProductProps> = {}): Product {
  return Product.create({
    name: 'Camiseta Básica',
    description: null,
    categoryId: null,
    active: true,
    variations: [buildVariationProps()],
    ...overrides,
  })
}
