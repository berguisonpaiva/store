import { User, UserProps, UserRole } from '../../src/user'
import { FAKE_HASH } from './fake-hash'

/// Builds a valid `User` for tests. Override any prop as needed.
export function buildUser(overrides: Partial<UserProps> = {}): User {
  return User.create({
    name: 'Ana Silva',
    email: 'ana.silva@store.com',
    passwordHash: FAKE_HASH,
    role: UserRole.OPERADOR,
    active: true,
    ...overrides,
  })
}
