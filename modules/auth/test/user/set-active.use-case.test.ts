import {
  ActivateUser,
  DeactivateUser,
  UserError,
  UserRole,
} from '../../src/user'
import { InMemoryUserRepository } from '../mock/in-memory-user.repository'
import { buildUser } from '../mock/user-builder'

describe('ActivateUser / DeactivateUser', () => {
  test('activates an inactive user', async () => {
    const repository = new InMemoryUserRepository()
    const useCase = new ActivateUser(repository)
    const user = buildUser({ active: false })
    await repository.create(user)

    const result = await useCase.execute({
      actorRole: UserRole.ADMIN,
      id: user.id,
    })

    expect(result.isOk).toBe(true)
    expect(result.instance.active).toBe(true)
  })

  test('deactivates another user', async () => {
    const repository = new InMemoryUserRepository()
    const useCase = new DeactivateUser(repository)
    const target = buildUser({ email: 'target@store.com' })
    await repository.create(target)

    const result = await useCase.execute({
      actorRole: UserRole.ADMIN,
      userId: target.id,
      requesterId: 'another-admin-id',
    })

    expect(result.isOk).toBe(true)
    expect(result.instance.active).toBe(false)
  })

  test('blocks deactivating yourself with CANNOT_DEACTIVATE_SELF', async () => {
    const repository = new InMemoryUserRepository()
    const useCase = new DeactivateUser(repository)
    const admin = buildUser({ email: 'admin@store.com', role: UserRole.ADMIN })
    await repository.create(admin)

    const result = await useCase.execute({
      actorRole: UserRole.ADMIN,
      userId: admin.id,
      requesterId: admin.id,
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(UserError.CANNOT_DEACTIVATE_SELF)
    const stored = await repository.findById(admin.id)
    expect(stored.instance.active).toBe(true)
  })

  test('returns USER_NOT_FOUND for a missing user', async () => {
    const repository = new InMemoryUserRepository()
    const useCase = new DeactivateUser(repository)

    const result = await useCase.execute({
      actorRole: UserRole.ADMIN,
      userId: 'b3f1c2d4-0000-4000-8000-000000000000',
      requesterId: 'another-admin-id',
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(UserError.USER_NOT_FOUND)
  })
})
