import { DeleteUser } from '../../src/user'
import { InMemoryUserRepository } from '../mock/in-memory-user.repository'
import { buildUser } from '../mock/user-builder'

describe('DeleteUser', () => {
  test('removes the user from the repository', async () => {
    const repository = new InMemoryUserRepository()
    const useCase = new DeleteUser(repository)
    const user = buildUser()
    await repository.create(user)

    const result = await useCase.execute({ id: user.id })

    expect(result.isOk).toBe(true)
    expect(repository.items.has(user.id)).toBe(false)
  })
})
