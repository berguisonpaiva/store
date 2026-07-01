import {
  AddVariation,
  ProductError,
  UpdateVariation,
} from '../../src/product'
import { InMemoryProductRepository } from '../mock/in-memory-product.repository'
import { buildProduct, buildVariationProps } from '../mock/product-builder'

describe('AddVariation', () => {
  test('adds a variation with a unique SKU', async () => {
    const products = new InMemoryProductRepository()
    const product = buildProduct()
    await products.create(product)
    const useCase = new AddVariation(products)

    const result = await useCase.execute({ productId: product.id, sku: 'SKU-2', price: 2000 })

    expect(result.isOk).toBe(true)
    expect(result.instance.variations).toHaveLength(2)
  })

  test('rejects a SKU already used by another variation of the same product', async () => {
    const products = new InMemoryProductRepository()
    const product = buildProduct({ variations: [buildVariationProps({ sku: 'SKU-1' })] })
    await products.create(product)
    const useCase = new AddVariation(products)

    const result = await useCase.execute({ productId: product.id, sku: 'SKU-1', price: 2000 })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(ProductError.SKU_ALREADY_IN_USE)
  })

  test('returns PRODUCT_NOT_FOUND for a missing product', async () => {
    const products = new InMemoryProductRepository()
    const useCase = new AddVariation(products)

    const result = await useCase.execute({
      productId: '22222222-2222-2222-2222-222222222222',
      sku: 'SKU-2',
      price: 2000,
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(ProductError.PRODUCT_NOT_FOUND)
  })
})

describe('UpdateVariation', () => {
  test('edits a variation price while keeping its own SKU', async () => {
    const products = new InMemoryProductRepository()
    const product = buildProduct()
    await products.create(product)
    const variationId = product.variations[0]!.id
    const useCase = new UpdateVariation(products)

    const result = await useCase.execute({
      productId: product.id,
      variationId,
      price: 9900,
    })

    expect(result.isOk).toBe(true)
    expect(result.instance.variations.find((v) => v.id === variationId)!.price).toBe(9900)
  })

  test('returns VARIATION_NOT_FOUND for a missing variation', async () => {
    const products = new InMemoryProductRepository()
    const product = buildProduct()
    await products.create(product)
    const useCase = new UpdateVariation(products)

    const result = await useCase.execute({
      productId: product.id,
      variationId: '33333333-3333-3333-3333-333333333333',
      price: 5000,
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(ProductError.VARIATION_NOT_FOUND)
  })

  test('rejects changing a SKU to one used by another product', async () => {
    const products = new InMemoryProductRepository()
    const other = buildProduct({ variations: [buildVariationProps({ sku: 'TAKEN' })] })
    const product = buildProduct({ variations: [buildVariationProps({ sku: 'SKU-1' })] })
    await products.create(other)
    await products.create(product)
    const variationId = product.variations[0]!.id
    const useCase = new UpdateVariation(products)

    const result = await useCase.execute({ productId: product.id, variationId, sku: 'TAKEN' })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(ProductError.SKU_ALREADY_IN_USE)
  })

  test('rejects a price <= 0', async () => {
    const products = new InMemoryProductRepository()
    const product = buildProduct()
    await products.create(product)
    const variationId = product.variations[0]!.id
    const useCase = new UpdateVariation(products)

    const result = await useCase.execute({ productId: product.id, variationId, price: -1 })

    expect(result.isFailure).toBe(true)
  })
})
