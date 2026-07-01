import { ListUsers, UserRole } from '../../src/user'
import { InMemoryUserRepository } from '../mock/in-memory-user.repository'
import { buildUser } from '../mock/user-builder'

describe('ListUsers', () => {
  test('paginates and filters by role and active status', async () => {
    const repository = new InMemoryUserRepository()
    await repository.create(
      buildUser({ email: 'op1@store.com', role: UserRole.OPERADOR, active: true }),
    )
    await repository.create(
      buildUser({ email: 'op2@store.com', role: UserRole.OPERADOR, active: false }),
    )
    await repository.create(
      buildUser({ email: 'adm@store.com', role: UserRole.ADMIN, active: true }),
    )
    const useCase = new ListUsers(repository)

    const result = await useCase.execute({
      page: 1,
      pageSize: 10,
      role: UserRole.OPERADOR,
      active: true,
    })

    expect(result.isOk).toBe(true)
    expect(result.instance.meta.total).toBe(1)
    expect(result.instance.data).toHaveLength(1)
    expect(result.instance.data[0]!.email).toBe('op1@store.com')
  })

  test('respects pagination size', async () => {
    const repository = new InMemoryUserRepository()
    for (let i = 0; i < 5; i++) {
      await repository.create(buildUser({ email: `u${i}@store.com` }))
    }
    const useCase = new ListUsers(repository)

    const result = await useCase.execute({ page: 1, pageSize: 2 })

    expect(result.instance.data).toHaveLength(2)
    expect(result.instance.meta.total).toBe(5)
    expect(result.instance.meta.totalPages).toBe(3)
  })
})
