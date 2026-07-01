import { Result } from '@repo/shared'
import { UserError } from '../errors'
import { User } from '../model'

/// Pure specification: an email is unique unless it belongs to a *different*
/// user. The use case supplies the lookup result; the rule is decided here,
/// not by a database unique index.
export class UniqueEmailSpecification {
  static ensureUnique(existing: User | null, selfId?: string): Result<void> {
    if (existing && existing.id !== selfId) {
      return Result.fail(UserError.EMAIL_ALREADY_IN_USE)
    }
    return Result.ok()
  }
}
