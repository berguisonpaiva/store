import {
  LastMasterPolicy,
  RoleAuthorizationPolicy,
  UniqueEmailSpecification,
  UserError,
  UserRole,
} from '../../src/user'
import { buildUser } from '../mock/user-builder'

describe('RoleAuthorizationPolicy', () => {
  test('allows MASTER and ADMIN, blocks OPERADOR', () => {
    expect(
      RoleAuthorizationPolicy.ensureCanManageUsers(UserRole.MASTER).isOk,
    ).toBe(true)
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

describe('LastMasterPolicy', () => {
  test('blocks deactivating the only active MASTER', () => {
    const master = buildUser({ role: UserRole.MASTER })
    expect(LastMasterPolicy.ensureCanDeactivate(master, 1).isFailure).toBe(true)
  })

  test('allows deactivating when another MASTER exists', () => {
    const master = buildUser({ role: UserRole.MASTER })
    expect(LastMasterPolicy.ensureCanDeactivate(master, 2).isOk).toBe(true)
  })

  test('blocks demoting the only active MASTER', () => {
    const master = buildUser({ role: UserRole.MASTER })
    expect(
      LastMasterPolicy.ensureCanChangeRole(master, UserRole.ADMIN, 1).isFailure,
    ).toBe(true)
  })
})
