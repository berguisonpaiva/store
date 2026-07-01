import {
  RoleAuthorizationPolicy,
  UniqueEmailSpecification,
  UserError,
  UserRole,
} from '../../src/user'
import { buildUser } from '../mock/user-builder'

describe('RoleAuthorizationPolicy', () => {
  test('allows ADMIN, blocks OPERADOR', () => {
    expect(
      RoleAuthorizationPolicy.ensureCanManageUsers(UserRole.ADMIN).isOk,
    ).toBe(true)

    const blocked = RoleAuthorizationPolicy.ensureCanManageUsers(
      UserRole.OPERADOR,
    )
    expect(blocked.isFailure).toBe(true)
    expect(blocked.errors).toContain(UserError.OPERATION_NOT_ALLOWED_FOR_ROLE)
  })
})

describe('UniqueEmailSpecification', () => {
  test('passes when no user owns the email', () => {
    expect(UniqueEmailSpecification.ensureUnique(null).isOk).toBe(true)
  })

  test('passes when the email belongs to the same user', () => {
    const user = buildUser()
    expect(UniqueEmailSpecification.ensureUnique(user, user.id).isOk).toBe(true)
  })

  test('fails when another user owns the email', () => {
    const other = buildUser()
    const result = UniqueEmailSpecification.ensureUnique(other, 'another-id')
    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(UserError.EMAIL_ALREADY_IN_USE)
  })
})
