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

  test('deactivates a non-last MASTER', async () => {
    const repository = new InMemoryUserRepository()
    const useCase = new DeactivateUser(repository)
    const m1 = buildUser({ email: 'm1@store.com', role: UserRole.MASTER })
    const m2 = buildUser({ email: 'm2@store.com', role: UserRole.MASTER })
    await repository.create(m1)
    await repository.create(m2)

    const result = await useCase.execute({
      actorRole: UserRole.MASTER,
      id: m1.id,
    })

    expect(result.isOk).toBe(true)
    expect(result.instance.active).toBe(false)
  })

  test('blocks deactivating the last active MASTER', async () => {
    const repository = new InMemoryUserRepository()
    const useCase = new DeactivateUser(repository)
    const master = buildUser({ email: 'm@store.com', role: UserRole.MASTER })
    await repository.create(master)

    const result = await useCase.execute({
      actorRole: UserRole.MASTER,
      id: master.id,
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(UserError.OPERATION_NOT_ALLOWED_FOR_ROLE)
    const stored = await repository.findById(master.id)
    expect(stored.instance.active).toBe(true)
  })
})
