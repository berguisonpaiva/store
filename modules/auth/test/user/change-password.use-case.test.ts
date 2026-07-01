import { ChangePassword, UserError } from '../../src/user'
import { FakeHashComparer, FakeHashGenerator } from '../mock/fake-hash'
import { InMemoryUserRepository } from '../mock/in-memory-user.repository'
import { buildUser } from '../mock/user-builder'

describe('ChangePassword', () => {
  test('changes the password when the current one matches', async () => {
    const repository = new InMemoryUserRepository()
    const user = buildUser()
    await repository.create(user)
    const useCase = new ChangePassword(
      repository,
      new FakeHashGenerator(),
      new FakeHashComparer('current-pass'),
    )

    const result = await useCase.execute({
      id: user.id,
      currentPassword: 'current-pass',
      newPassword: 'New!Str0ng',
    })

    expect(result.isOk).toBe(true)
  })

  test('rejects a wrong current password', async () => {
    const repository = new InMemoryUserRepository()
    const user = buildUser()
    await repository.create(user)
    const useCase = new ChangePassword(
      repository,
      new FakeHashGenerator(),
      new FakeHashComparer('current-pass'),
    )

    const result = await useCase.execute({
      id: user.id,
      currentPassword: 'wrong',
      newPassword: 'New!Str0ng',
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(UserError.INVALID_CURRENT_PASSWORD)
  })

  test('rejects a weak new password', async () => {
    const repository = new InMemoryUserRepository()
    const user = buildUser()
    await repository.create(user)
    const useCase = new ChangePassword(
      repository,
      new FakeHashGenerator(),
      new FakeHashComparer(),
    )

    const result = await useCase.execute({
      id: user.id,
      currentPassword: 'whatever',
      newPassword: 'weak',
    })

    expect(result.isFailure).toBe(true)
  })
})
