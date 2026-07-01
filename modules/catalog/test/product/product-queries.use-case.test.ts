import {
  ActivateProduct,
  DeactivateProduct,
  DeactivateVariation,
  FindProductById,
  FindVariationByBarcode,
  FindVariationBySku,
  ListProducts,
  ProductError,
} from '../../src/product'
import { InMemoryProductRepository } from '../mock/in-memory-product.repository'
import { buildProduct, buildVariationProps } from '../mock/product-builder'

describe('Activate / Deactivate product and variation', () => {
  test('deactivates and reactivates a product without deleting it', async () => {
    const products = new InMemoryProductRepository()
    const product = buildProduct()
    await products.create(product)

    const deactivated = await new DeactivateProduct(products).execute({ id: product.id })
    expect(deactivated.instance.active).toBe(false)
    expect(products.items.size).toBe(1)

    const activated = await new ActivateProduct(products).execute({ id: product.id })
    expect(activated.instance.active).toBe(true)
  })

  test('deactivates a variation', async () => {
    const products = new InMemoryProductRepository()
    const product = buildProduct()
    await products.create(product)
    const variationId = product.variations[0]!.id

    const result = await new DeactivateVariation(products).execute({
      productId: product.id,
      variationId,
    })

    expect(result.isOk).toBe(true)
    expect(result.instance.variations.find((v) => v.id === variationId)!.active).toBe(false)
  })

  test('returns PRODUCT_NOT_FOUND when activating a missing product', async () => {
    const products = new InMemoryProductRepository()
    const result = await new ActivateProduct(products).execute({
      id: '44444444-4444-4444-4444-444444444444',
    })
    expect(result.errors).toContain(ProductError.PRODUCT_NOT_FOUND)
  })
})

describe('FindProductById', () => {
  test('returns the product projection', async () => {
    const products = new InMemoryProductRepository()
    const product = buildProduct()
    await products.create(product)

    const result = await new FindProductById(products).execute({ id: product.id })

    expect(result.isOk).toBe(true)
    expect(result.instance.id).toBe(product.id)
  })

  test('returns PRODUCT_NOT_FOUND for a missing id', async () => {
    const products = new InMemoryProductRepository()
    const result = await new FindProductById(products).execute({
      id: '55555555-5555-5555-5555-555555555555',
    })
    expect(result.errors).toContain(ProductError.PRODUCT_NOT_FOUND)
  })
})

describe('ListProducts', () => {
  test('paginates and filters by name and status', async () => {
    const products = new InMemoryProductRepository()
    await products.create(buildProduct({ name: 'Camiseta Azul', variations: [buildVariationProps({ sku: 'A' })] }))
    await products.create(buildProduct({ name: 'Calça Jeans', variations: [buildVariationProps({ sku: 'B' })] }))

    const result = await new ListProducts(products).execute({
      page: 1,
      pageSize: 10,
      name: 'camiseta',
    })

    expect(result.isOk).toBe(true)
    expect(result.instance.data).toHaveLength(1)
    expect(result.instance.data[0]!.name).toBe('Camiseta Azul')
    expect(result.instance.meta.total).toBe(1)
  })
})

describe('PDV lookups', () => {
  test('finds a variation by exact SKU', async () => {
    const products = new InMemoryProductRepository()
    const product = buildProduct({ variations: [buildVariationProps({ sku: 'SKU-PDV' })] })
    await products.create(product)

    const result = await new FindVariationBySku(products).execute({ sku: 'sku-pdv' })

    expect(result.isOk).toBe(true)
    expect(result.instance.variation.sku).toBe('SKU-PDV')
    expect(result.instance.productId).toBe(product.id)
  })

  test('returns VARIATION_NOT_FOUND for an unknown barcode', async () => {
    const products = new InMemoryProductRepository()
    const result = await new FindVariationByBarcode(products).execute({ barcode: '000' })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(ProductError.VARIATION_NOT_FOUND)
  })

  test('finds a variation by exact barcode', async () => {
    const products = new InMemoryProductRepository()
    const product = buildProduct({
      variations: [buildVariationProps({ sku: 'SKU-BC', barcode: '7891234' })],
    })
    await products.create(product)

    const result = await new FindVariationByBarcode(products).execute({ barcode: '7891234' })

    expect(result.isOk).toBe(true)
    expect(result.instance.variation.barcode).toBe('7891234')
  })
})
