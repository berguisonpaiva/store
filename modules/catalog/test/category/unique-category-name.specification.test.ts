import { CategoryError, UniqueCategoryNameSpecification } from '../../src/category'
import { buildCategory } from '../mock/category-builder'

describe('UniqueCategoryNameSpecification', () => {
  test('passes when no category owns the name', () => {
    expect(UniqueCategoryNameSpecification.ensureUnique(null).isOk).toBe(true)
  })

  test('fails when a different category owns the name', () => {
    const existing = buildCategory()

    const result = UniqueCategoryNameSpecification.ensureUnique(existing)

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(CategoryError.CATEGORY_NAME_ALREADY_IN_USE)
  })

  test('passes when the match is the same category being edited', () => {
    const existing = buildCategory()

    expect(UniqueCategoryNameSpecification.ensureUnique(existing, existing.id).isOk).toBe(true)
  })
})
