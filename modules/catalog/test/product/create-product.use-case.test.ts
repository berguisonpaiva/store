import { CategoryError } from '../../src/category'
import { CreateProduct, ProductError } from '../../src/product'
import { buildCategory } from '../mock/category-builder'
import { InMemoryCategoryRepository } from '../mock/in-memory-category.repository'
import { InMemoryProductRepository } from '../mock/in-memory-product.repository'
import { buildProduct } from '../mock/product-builder'

function makeUseCase() {
  const products = new InMemoryProductRepository()
  const categories = new InMemoryCategoryRepository()
  const useCase = new CreateProduct(products, categories)
  return { products, categories, useCase }
}

const validInput = {
  name: 'Camiseta Básica',
  variations: [{ sku: 'SKU-1', price: 1000 }],
}

describe('CreateProduct', () => {
  test('creates a product with its initial variation', async () => {
    const { products, useCase } = makeUseCase()

    const result = await useCase.execute(validInput)

    expect(result.isOk).toBe(true)
    expect(result.instance.variations).toHaveLength(1)
    expect(result.instance.variations[0]!.sku).toBe('SKU-1')
    expect(products.items.size).toBe(1)
  })

  test('rejects a product with no variation', async () => {
    const { useCase } = makeUseCase()

    const result = await useCase.execute({ name: 'Camiseta', variations: [] })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(ProductError.PRODUCT_MUST_HAVE_VARIATION)
  })

  test('rejects an unknown category with CATEGORY_NOT_FOUND', async () => {
    const { useCase } = makeUseCase()

    const result = await useCase.execute({
      ...validInput,
      categoryId: '11111111-1111-1111-1111-111111111111',
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(CategoryError.CATEGORY_NOT_FOUND)
  })

  test('rejects an inactive category with CATEGORY_INACTIVE', async () => {
    const { categories, useCase } = makeUseCase()
    const category = buildCategory({ active: false })
    await categories.create(category)

    const result = await useCase.execute({ ...validInput, categoryId: category.id })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(CategoryError.CATEGORY_INACTIVE)
  })

  test('accepts an existing active category', async () => {
    const { categories, useCase } = makeUseCase()
    const category = buildCategory()
    await categories.create(category)

    const result = await useCase.execute({ ...validInput, categoryId: category.id })

    expect(result.isOk).toBe(true)
    expect(result.instance.categoryId).toBe(category.id)
  })

  test('rejects a SKU already used by another product', async () => {
    const { products, useCase } = makeUseCase()
    await products.create(buildProduct())

    const result = await useCase.execute(validInput)

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(ProductError.SKU_ALREADY_IN_USE)
  })

  test('rejects a barcode already used by another product', async () => {
    const { products, useCase } = makeUseCase()
    await products.create(
      buildProduct({
        variations: [
          { sku: 'SKU-OTHER', barcode: '789', attributes: {}, price: 1000, minStock: 0, active: true },
        ],
      }),
    )

    const result = await useCase.execute({
      name: 'Outra',
      variations: [{ sku: 'SKU-NEW', barcode: '789', price: 1000 }],
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(ProductError.BARCODE_ALREADY_IN_USE)
  })

  test('rejects duplicate SKUs within the same create payload', async () => {
    const { useCase } = makeUseCase()

    const result = await useCase.execute({
      name: 'Camiseta',
      variations: [
        { sku: 'SKU-DUP', price: 1000 },
        { sku: 'SKU-DUP', price: 2000 },
      ],
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(ProductError.SKU_ALREADY_IN_USE)
  })

  test('rejects a price <= 0 with a failed Result (InvalidPrice)', async () => {
    const { useCase } = makeUseCase()

    const result = await useCase.execute({
      name: 'Camiseta',
      variations: [{ sku: 'SKU-1', price: 0 }],
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(ProductError.INVALID_PRICE)
  })
})
