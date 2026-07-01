import { Result } from '@repo/shared'
import { UserError } from '../errors'
import { UserRole } from '../model/user-role'

/// Pure policy: only MASTER/ADMIN may create users or change roles. No I/O.
export class RoleAuthorizationPolicy {
  static canManageUsers(actorRole: UserRole): boolean {
    return actorRole === UserRole.MASTER || actorRole === UserRole.ADMIN
  }

  static ensureCanManageUsers(actorRole: UserRole): Result<void> {
    return RoleAuthorizationPolicy.canManageUsers(actorRole)
      ? Result.ok()
      : Result.fail(UserError.OPERATION_NOT_ALLOWED_FOR_ROLE)
  }
}
