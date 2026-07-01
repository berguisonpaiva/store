import { UpdateUser, UserError, UserRole } from '../../src/user'
import { InMemoryUserRepository } from '../mock/in-memory-user.repository'
import { buildUser } from '../mock/user-builder'

function makeUseCase() {
  const repository = new InMemoryUserRepository()
  const useCase = new UpdateUser(repository)
  return { repository, useCase }
}

describe('UpdateUser', () => {
  test('updates name, email and role', async () => {
    const { repository, useCase } = makeUseCase()
    const user = buildUser({ email: 'old@store.com' })
    await repository.create(user)

    const result = await useCase.execute({
      actorRole: UserRole.MASTER,
      id: user.id,
      name: 'Carla Dias',
      email: 'carla@store.com',
      role: UserRole.ADMIN,
    })

    expect(result.isOk).toBe(true)
    expect(result.instance.email).toBe('carla@store.com')
    expect(result.instance.role).toBe(UserRole.ADMIN)
  })

  test('returns USER_NOT_FOUND for a missing user', async () => {
    const { useCase } = makeUseCase()

    const result = await useCase.execute({
      actorRole: UserRole.ADMIN,
      id: 'b3f1c2d4-0000-4000-8000-000000000000',
      name: 'X Y',
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(UserError.USER_NOT_FOUND)
  })

  test('rejects an email already used by another user', async () => {
    const { repository, useCase } = makeUseCase()
    const a = buildUser({ email: 'a@store.com' })
    const b = buildUser({ email: 'b@store.com' })
    await repository.create(a)
    await repository.create(b)

    const result = await useCase.execute({
      actorRole: UserRole.ADMIN,
      id: b.id,
      email: 'a@store.com',
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(UserError.EMAIL_ALREADY_IN_USE)
  })

  test('forbids an OPERADOR actor', async () => {
    const { repository, useCase } = makeUseCase()
    const user = buildUser()
    await repository.create(user)

    const result = await useCase.execute({
      actorRole: UserRole.OPERADOR,
      id: user.id,
      name: 'New Name',
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(UserError.OPERATION_NOT_ALLOWED_FOR_ROLE)
  })

  test('blocks demoting the last active MASTER', async () => {
    const { repository, useCase } = makeUseCase()
    const master = buildUser({ email: 'master@store.com', role: UserRole.MASTER })
    await repository.create(master)

    const result = await useCase.execute({
      actorRole: UserRole.MASTER,
      id: master.id,
      role: UserRole.ADMIN,
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(UserError.OPERATION_NOT_ALLOWED_FOR_ROLE)
  })
})
