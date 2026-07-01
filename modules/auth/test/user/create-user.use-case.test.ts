import { CreateUser, UserError, UserRole } from '../../src/user'
import { FakeHashGenerator } from '../mock/fake-hash'
import { InMemoryUserRepository } from '../mock/in-memory-user.repository'
import { buildUser } from '../mock/user-builder'

function makeUseCase() {
  const repository = new InMemoryUserRepository()
  const useCase = new CreateUser(repository, new FakeHashGenerator())
  return { repository, useCase }
}

const validInput = {
  actorRole: UserRole.ADMIN,
  name: 'Bruno Costa',
  email: 'bruno@store.com',
  password: 'Str0ng!Pass',
  role: UserRole.OPERADOR,
}

describe('CreateUser', () => {
  test('creates a staff user and never exposes the password hash', async () => {
    const { repository, useCase } = makeUseCase()

    const result = await useCase.execute(validInput)

    expect(result.isOk).toBe(true)
    expect(result.instance.email).toBe('bruno@store.com')
    expect(result.instance).not.toHaveProperty('passwordHash')
    expect(repository.items.size).toBe(1)
  })

  test('rejects a duplicate email with EMAIL_ALREADY_IN_USE', async () => {
    const { repository, useCase } = makeUseCase()
    await repository.create(buildUser({ email: 'bruno@store.com' }))

    const result = await useCase.execute(validInput)

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(UserError.EMAIL_ALREADY_IN_USE)
  })

  test('forbids an OPERADOR actor', async () => {
    const { useCase } = makeUseCase()

    const result = await useCase.execute({
      ...validInput,
      actorRole: UserRole.OPERADOR,
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(UserError.OPERATION_NOT_ALLOWED_FOR_ROLE)
  })

  test('rejects a weak password', async () => {
    const { useCase } = makeUseCase()

    const result = await useCase.execute({ ...validInput, password: 'weak' })

    expect(result.isFailure).toBe(true)
  })
})
