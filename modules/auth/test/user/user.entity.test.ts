import { User, UserError, UserRole } from '../../src/user'
import { FAKE_HASH } from '../mock/fake-hash'

const baseProps = {
  name: 'Ana Silva',
  email: 'ANA.Silva@Store.com',
  passwordHash: FAKE_HASH,
  role: UserRole.OPERADOR,
  active: true,
}

describe('User entity', () => {
  test('creates a valid user and normalizes the email', () => {
    const result = User.tryCreate(baseProps)

    expect(result.isOk).toBe(true)
    expect(result.instance.email).toBe('ana.silva@store.com')
    expect(result.instance.role).toBe(UserRole.OPERADOR)
  })

  test('rejects an invalid email', () => {
    const result = User.tryCreate({ ...baseProps, email: 'not-an-email' })
    expect(result.isFailure).toBe(true)
  })

  test('rejects an invalid role', () => {
    const result = User.tryCreate({
      ...baseProps,
      role: 'SUPERUSER' as UserRole,
    })
    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(UserError.INVALID_ROLE)
  })

  test('rejects a non-hash password (no plain text accepted)', () => {
    const result = User.tryCreate({ ...baseProps, passwordHash: 'plain-text' })
    expect(result.isFailure).toBe(true)
  })

  test('activate / deactivate / changeRole produce new valid users', () => {
    const user = User.create(baseProps)

    expect(user.deactivate().instance.active).toBe(false)
    expect(user.activate().instance.active).toBe(true)
    expect(user.changeRole(UserRole.ADMIN).instance.role).toBe(UserRole.ADMIN)
  })
})
