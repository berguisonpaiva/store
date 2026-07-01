import { Variation } from '../../src/product'
import { buildVariationProps } from '../mock/product-builder'

describe('Variation entity', () => {
  test('creates a valid variation and normalizes the SKU', () => {
    const result = Variation.tryCreate(buildVariationProps({ sku: ' sku-9 ' }))

    expect(result.isOk).toBe(true)
    expect(result.instance.sku).toBe('SKU-9')
    expect(result.instance.active).toBe(true)
  })

  test('rejects a price <= 0', () => {
    expect(Variation.tryCreate(buildVariationProps({ price: 0 })).isFailure).toBe(true)
    expect(Variation.tryCreate(buildVariationProps({ price: -100 })).isFailure).toBe(true)
  })

  test('rejects a non-integer price (cents must be whole)', () => {
    expect(Variation.tryCreate(buildVariationProps({ price: 10.5 })).isFailure).toBe(true)
  })

  test('defaults minStock to 0 and rejects a negative minStock', () => {
    const withoutMinStock = Variation.tryCreate(
      buildVariationProps({ minStock: undefined as unknown as number }),
    )
    expect(withoutMinStock.isOk).toBe(true)
    expect(withoutMinStock.instance.minStock).toBe(0)

    expect(Variation.tryCreate(buildVariationProps({ minStock: -1 })).isFailure).toBe(true)
  })

  test('allows a missing barcode and exposes it as null', () => {
    const result = Variation.tryCreate(buildVariationProps({ barcode: null }))
    expect(result.isOk).toBe(true)
    expect(result.instance.barcode).toBeNull()
  })

  test('edit replaces the attributes map wholesale', () => {
    const variation = Variation.create(buildVariationProps({ attributes: { size: 'M' } }))

    const edited = variation.edit({ attributes: { color: 'Blue' } })

    expect(edited.isOk).toBe(true)
    expect(edited.instance.attributes).toEqual({ color: 'Blue' })
  })

  test('activate / deactivate produce new valid variations', () => {
    const variation = Variation.create(buildVariationProps())
    expect(variation.deactivate().instance.active).toBe(false)
    expect(variation.activate().instance.active).toBe(true)
  })
})
