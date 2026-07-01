import {
  ActivateCategory,
  CategoryError,
  CreateCategory,
  DeactivateCategory,
  ListCategories,
  UpdateCategory,
} from '../../src/category'
import { buildCategory } from '../mock/category-builder'
import { InMemoryCategoryRepository } from '../mock/in-memory-category.repository'

describe('CreateCategory', () => {
  test('creates a category with a unique name', async () => {
    const repo = new InMemoryCategoryRepository()
    const result = await new CreateCategory(repo).execute({ name: 'Vestuário' })

    expect(result.isOk).toBe(true)
    expect(result.instance.name).toBe('Vestuário')
    expect(repo.items.size).toBe(1)
  })

  test('rejects a duplicate name with CATEGORY_NAME_ALREADY_IN_USE', async () => {
    const repo = new InMemoryCategoryRepository()
    await repo.create(buildCategory({ name: 'Vestuário' }))

    const result = await new CreateCategory(repo).execute({ name: 'Vestuário' })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(CategoryError.CATEGORY_NAME_ALREADY_IN_USE)
  })

  test('rejects an empty name', async () => {
    const repo = new InMemoryCategoryRepository()
    const result = await new CreateCategory(repo).execute({ name: '   ' })
    expect(result.isFailure).toBe(true)
  })
})

describe('UpdateCategory', () => {
  test('renames an existing category', async () => {
    const repo = new InMemoryCategoryRepository()
    const category = buildCategory({ name: 'Vestuário' })
    await repo.create(category)

    const result = await new UpdateCategory(repo).execute({ id: category.id, name: 'Calçados' })

    expect(result.isOk).toBe(true)
    expect(result.instance.name).toBe('Calçados')
  })

  test('returns CATEGORY_NOT_FOUND for a missing id', async () => {
    const repo = new InMemoryCategoryRepository()
    const result = await new UpdateCategory(repo).execute({
      id: '66666666-6666-6666-6666-666666666666',
      name: 'X',
    })
    expect(result.errors).toContain(CategoryError.CATEGORY_NOT_FOUND)
  })

  test('rejects renaming to a name used by another category', async () => {
    const repo = new InMemoryCategoryRepository()
    await repo.create(buildCategory({ name: 'Calçados' }))
    const target = buildCategory({ name: 'Vestuário' })
    await repo.create(target)

    const result = await new UpdateCategory(repo).execute({ id: target.id, name: 'Calçados' })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(CategoryError.CATEGORY_NAME_ALREADY_IN_USE)
  })
})

describe('Activate / Deactivate / List categories', () => {
  test('deactivates and reactivates a category', async () => {
    const repo = new InMemoryCategoryRepository()
    const category = buildCategory()
    await repo.create(category)

    const deactivated = await new DeactivateCategory(repo).execute({ id: category.id })
    expect(deactivated.instance.active).toBe(false)

    const activated = await new ActivateCategory(repo).execute({ id: category.id })
    expect(activated.instance.active).toBe(true)
  })

  test('lists categories with an optional active filter', async () => {
    const repo = new InMemoryCategoryRepository()
    await repo.create(buildCategory({ name: 'Ativa', active: true }))
    await repo.create(buildCategory({ name: 'Inativa', active: false }))

    const all = await new ListCategories(repo).execute()
    expect(all.instance).toHaveLength(2)

    const active = await new ListCategories(repo).execute({ active: true })
    expect(active.instance).toHaveLength(1)
    expect(active.instance[0]!.name).toBe('Ativa')
  })
})
