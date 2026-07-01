import { Category, CategoryProps } from '../../src/category'

/// Builds a valid `Category` for tests. Override any prop as needed.
export function buildCategory(overrides: Partial<CategoryProps> = {}): Category {
  return Category.create({
    name: 'Vestuário',
    active: true,
    ...overrides,
  })
}
