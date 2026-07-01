import { Result } from '@repo/shared'
import { User } from '../../user'
import { AuthError } from '../errors'

/// Pure policy that decides a login outcome. The password comparison itself is
/// done by the use case (via the HashComparer port) and passed in as a boolean
/// so this policy stays side-effect free.
///
/// Unknown email and wrong password yield the SAME generic error so the API
/// never reveals whether an email exists.
export class CredentialsPolicy {
  static evaluate(user: User | null, passwordMatches: boolean): Result<void> {
    if (!user || !passwordMatches) {
      return Result.fail(AuthError.INVALID_CREDENTIALS)
    }
    if (!user.active) {
      return Result.fail(AuthError.USER_INACTIVE)
    }
    return Result.ok()
  }
}
