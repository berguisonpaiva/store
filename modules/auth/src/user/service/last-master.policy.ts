import { Result } from '@repo/shared'
import { UserError } from '../errors'
import { User } from '../model'
import { UserRole } from '../model/user-role'

/// Pure policy: the system must always keep at least one active MASTER.
/// The use case supplies the count of currently active MASTERs; the decision
/// is made here, never by a database constraint.
export class LastMasterPolicy {
  /// Blocks deactivating the only active MASTER.
  static ensureCanDeactivate(
    target: User,
    activeMasterCount: number,
  ): Result<void> {
    if (target.isMaster && target.active && activeMasterCount <= 1) {
      return Result.fail(UserError.OPERATION_NOT_ALLOWED_FOR_ROLE)
    }
    return Result.ok()
  }

  /// Blocks demoting the only active MASTER away from MASTER.
  static ensureCanChangeRole(
    target: User,
    newRole: UserRole,
    activeMasterCount: number,
  ): Result<void> {
    const demotingMaster =
      target.isMaster && target.active && newRole !== UserRole.MASTER
    if (demotingMaster && activeMasterCount <= 1) {
      return Result.fail(UserError.OPERATION_NOT_ALLOWED_FOR_ROLE)
    }
    return Result.ok()
  }
}
