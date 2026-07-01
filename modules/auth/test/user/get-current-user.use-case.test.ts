import { GetCurrentUser, UserError } from '../../src/user'
import { InMemoryUserRepository } from '../mock/in-memory-user.repository'
import { buildUser } from '../mock/user-builder'

function makeUseCase() {
  const repository = new InMemoryUserRepository()
  const useCase = new GetCurrentUser(repository)
  return { repository, useCase }
}

describe('GetCurrentUser', () => {
  test('returns the current user projection without the password hash', async () => {
    const { repository, useCase } = makeUseCase()
    const user = buildUser()
    await repository.create(user)

    const result = await useCase.execute({ userId: user.id })

    expect(result.isOk).toBe(true)
    expect(result.instance.id).toBe(user.id)
    expect(result.instance.email).toBe(user.email)
    expect(result.instance).not.toHaveProperty('passwordHash')
  })

  test('returns USER_NOT_FOUND when the id no longer maps to a user', async () => {
    const { useCase } = makeUseCase()

    const result = await useCase.execute({
      userId: 'b3f1c2d4-0000-4000-8000-000000000000',
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(UserError.USER_NOT_FOUND)
  })
})
