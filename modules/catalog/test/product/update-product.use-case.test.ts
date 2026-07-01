import { CategoryError } from '../../src/category'
import { ProductError, UpdateProduct } from '../../src/product'
import { buildCategory } from '../mock/category-builder'
import { InMemoryCategoryRepository } from '../mock/in-memory-category.repository'
import { InMemoryProductRepository } from '../mock/in-memory-product.repository'
import { buildProduct } from '../mock/product-builder'

function makeUseCase() {
  const products = new InMemoryProductRepository()
  const categories = new InMemoryCategoryRepository()
  const useCase = new UpdateProduct(products, categories)
  return { products, categories, useCase }
}

describe('UpdateProduct', () => {
  test('edits the profile of an existing product', async () => {
    const { products, useCase } = makeUseCase()
    const product = buildProduct()
    await products.create(product)

    const result = await useCase.execute({ id: product.id, name: 'Renamed' })

    expect(result.isOk).toBe(true)
    expect(result.instance.name).toBe('Renamed')
  })

  test('returns PRODUCT_NOT_FOUND for a missing id', async () => {
    const { useCase } = makeUseCase()

    const result = await useCase.execute({
      id: '22222222-2222-2222-2222-222222222222',
      name: 'X',
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(ProductError.PRODUCT_NOT_FOUND)
  })

  test('rejects an unknown category with CATEGORY_NOT_FOUND', async () => {
    const { products, useCase } = makeUseCase()
    const product = buildProduct()
    await products.create(product)

    const result = await useCase.execute({
      id: product.id,
      categoryId: '11111111-1111-1111-1111-111111111111',
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(CategoryError.CATEGORY_NOT_FOUND)
  })

  test('rejects an inactive category with CATEGORY_INACTIVE', async () => {
    const { products, categories, useCase } = makeUseCase()
    const product = buildProduct()
    await products.create(product)
    const category = buildCategory({ active: false })
    await categories.create(category)

    const result = await useCase.execute({ id: product.id, categoryId: category.id })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(CategoryError.CATEGORY_INACTIVE)
  })

  test('accepts an existing active category', async () => {
    const { products, categories, useCase } = makeUseCase()
    const product = buildProduct()
    await products.create(product)
    const category = buildCategory()
    await categories.create(category)

    const result = await useCase.execute({ id: product.id, categoryId: category.id })

    expect(result.isOk).toBe(true)
    expect(result.instance.categoryId).toBe(category.id)
  })
})
