import { CategoryError } from '../../src/category'
import {
  ActiveCategorySpecification,
  ProductError,
  UniqueBarcodeSpecification,
  UniqueSkuSpecification,
} from '../../src/product'
import { buildCategory } from '../mock/category-builder'
import { buildProduct, buildVariationProps } from '../mock/product-builder'

describe('UniqueSkuSpecification', () => {
  test('passes when no product owns the SKU', () => {
    expect(UniqueSkuSpecification.ensureUnique(null, 'SKU-1').isOk).toBe(true)
  })

  test('fails when a different variation owns the SKU', () => {
    const owner = buildProduct({ variations: [buildVariationProps({ sku: 'SKU-1' })] })

    const result = UniqueSkuSpecification.ensureUnique(owner, 'SKU-1')

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(ProductError.SKU_ALREADY_IN_USE)
  })

  test('passes when the match is the same variation being edited', () => {
    const owner = buildProduct({ variations: [buildVariationProps({ sku: 'SKU-1' })] })
    const selfId = owner.variations[0]!.id

    expect(UniqueSkuSpecification.ensureUnique(owner, 'SKU-1', selfId).isOk).toBe(true)
  })
})

describe('UniqueBarcodeSpecification', () => {
  test('skips the check when no barcode is present', () => {
    expect(UniqueBarcodeSpecification.ensureUnique(null, null).isOk).toBe(true)
    expect(UniqueBarcodeSpecification.ensureUnique('', null).isOk).toBe(true)
  })

  test('fails when a different variation owns the barcode', () => {
    const owner = buildProduct({
      variations: [buildVariationProps({ sku: 'SKU-1', barcode: '789' })],
    })

    const result = UniqueBarcodeSpecification.ensureUnique('789', owner)

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(ProductError.BARCODE_ALREADY_IN_USE)
  })

  test('passes when the match is the same variation being edited', () => {
    const owner = buildProduct({
      variations: [buildVariationProps({ sku: 'SKU-1', barcode: '789' })],
    })
    const selfId = owner.variations[0]!.id

    expect(UniqueBarcodeSpecification.ensureUnique('789', owner, selfId).isOk).toBe(true)
  })
})

describe('ActiveCategorySpecification', () => {
  test('fails with CATEGORY_NOT_FOUND when the category is null', () => {
    const result = ActiveCategorySpecification.ensureUsable(null)

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(CategoryError.CATEGORY_NOT_FOUND)
  })

  test('fails with CATEGORY_INACTIVE when the category is inactive', () => {
    const result = ActiveCategorySpecification.ensureUsable(buildCategory({ active: false }))

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(CategoryError.CATEGORY_INACTIVE)
  })

  test('passes for an active category', () => {
    expect(ActiveCategorySpecification.ensureUsable(buildCategory()).isOk).toBe(true)
  })
})
