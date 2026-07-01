import { AuthError, Login } from '../../src/auth'
import { UserRole } from '../../src/user'
import { FakeHashComparer } from '../mock/fake-hash'
import { FakeTokenService } from '../mock/fake-token-service'
import { InMemoryUserRepository } from '../mock/in-memory-user.repository'
import { buildUser } from '../mock/user-builder'

function setup(correctPassword = 'secret') {
  const users = new InMemoryUserRepository()
  const tokens = new FakeTokenService()
  const login = new Login(users, new FakeHashComparer(correctPassword), tokens)
  return { users, tokens, login }
}

describe('Login', () => {
  test('issues access + refresh tokens and the user identity for valid active credentials', async () => {
    const { users, login } = setup()
    const user = buildUser({
      email: 'staff@store.com',
      active: true,
      role: UserRole.ADMIN,
    })
    await users.create(user)

    const result = await login.execute({
      email: 'staff@store.com',
      password: 'secret',
    })

    expect(result.isOk).toBe(true)
    expect(result.instance.accessToken).toBeTruthy()
    expect(result.instance.refreshToken).toBeTruthy()
    expect(result.instance.user).toEqual({
      id: user.id,
      name: user.name,
      role: UserRole.ADMIN,
    })
  })

  test('rejects an inactive user with USER_INACTIVE', async () => {
    const { users, login } = setup()
    await users.create(buildUser({ email: 'staff@store.com', active: false }))

    const result = await login.execute({
      email: 'staff@store.com',
      password: 'secret',
    })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(AuthError.USER_INACTIVE)
  })

  test('returns the same generic error for unknown email and wrong password', async () => {
    const { users, login } = setup()
    await users.create(buildUser({ email: 'staff@store.com', active: true }))

    const unknown = await login.execute({
      email: 'nobody@store.com',
      password: 'secret',
    })
    const wrong = await login.execute({
      email: 'staff@store.com',
      password: 'wrong',
    })

    expect(unknown.isFailure).toBe(true)
    expect(wrong.isFailure).toBe(true)
    expect(unknown.errors).toEqual([AuthError.INVALID_CREDENTIALS])
    expect(wrong.errors).toEqual([AuthError.INVALID_CREDENTIALS])
  })
})
