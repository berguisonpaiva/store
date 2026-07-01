import { Category } from '../../src/category'

describe('Category entity', () => {
  test('creates a valid category and trims the name', () => {
    const result = Category.tryCreate({ name: '  Vestuário  ', active: true })

    expect(result.isOk).toBe(true)
    expect(result.instance.name).toBe('Vestuário')
    expect(result.instance.active).toBe(true)
  })

  test('rejects an empty name', () => {
    expect(Category.tryCreate({ name: '   ', active: true }).isFailure).toBe(true)
  })

  test('rename / activate / deactivate produce new valid categories', () => {
    const category = Category.create({ name: 'Vestuário', active: true })

    expect(category.rename('Calçados').instance.name).toBe('Calçados')
    expect(category.deactivate().instance.active).toBe(false)
    expect(category.activate().instance.active).toBe(true)
  })
})
