import { Product, ProductError } from '../../src/product'
import { buildProduct, buildVariationProps } from '../mock/product-builder'

describe('Product entity', () => {
  test('creates a valid product with at least one variation', () => {
    const result = Product.tryCreate({
      name: 'Camiseta Básica',
      active: true,
      variations: [buildVariationProps()],
    })

    expect(result.isOk).toBe(true)
    expect(result.instance.variations).toHaveLength(1)
    expect(result.instance.active).toBe(true)
  })

  test('rejects a product without a variation with PRODUCT_MUST_HAVE_VARIATION', () => {
    const result = Product.tryCreate({ name: 'Camiseta', active: true, variations: [] })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(ProductError.PRODUCT_MUST_HAVE_VARIATION)
  })

  test('rejects a name shorter than 2 characters', () => {
    const result = Product.tryCreate({
      name: 'A',
      active: true,
      variations: [buildVariationProps()],
    })
    expect(result.isFailure).toBe(true)
  })

  test('propagates a variation validation failure (price <= 0)', () => {
    const result = Product.tryCreate({
      name: 'Camiseta',
      active: true,
      variations: [buildVariationProps({ price: 0 })],
    })
    expect(result.isFailure).toBe(true)
  })

  test('addVariation appends a new variation and re-validates the aggregate', () => {
    const product = buildProduct()
    const added = product.addVariation({ sku: 'SKU-2', price: 2000 })

    expect(added.isOk).toBe(true)
    expect(added.instance.variations).toHaveLength(2)
  })

  test('updateVariation on a missing id returns VARIATION_NOT_FOUND', () => {
    const product = buildProduct()
    const result = product.updateVariation('00000000-0000-0000-0000-000000000000', {
      price: 5000,
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(ProductError.VARIATION_NOT_FOUND)
  })

  test('updateVariation edits an existing variation', () => {
    const product = buildProduct()
    const variationId = product.variations[0]!.id

    const result = product.updateVariation(variationId, { price: 7500 })

    expect(result.isOk).toBe(true)
    expect(result.instance.variation(variationId)!.price).toBe(7500)
  })

  test('activate / deactivate product and variation transitions', () => {
    const product = buildProduct()
    const variationId = product.variations[0]!.id

    expect(product.deactivate().instance.active).toBe(false)
    expect(product.activate().instance.active).toBe(true)

    const deactivated = product.deactivateVariation(variationId)
    expect(deactivated.instance.variation(variationId)!.active).toBe(false)

    const reactivated = deactivated.instance.activateVariation(variationId)
    expect(reactivated.instance.variation(variationId)!.active).toBe(true)
  })

  test('there is no delete-product or delete-variation use case exported', () => {
    // Guard against re-introducing deletion (RF-CAT-06): the module exposes no
    // delete entry point.
    const productModule = require('../../src/product')
    const exportedNames = Object.keys(productModule)
    expect(exportedNames).not.toContain('DeleteProduct')
    expect(exportedNames).not.toContain('DeleteVariation')
  })
})
