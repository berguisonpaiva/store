import { CrudRepository, Result } from '@repo/shared'
import { User } from '../model'
import { UserRole } from '../model/user-role'

/// Persistence contract for the `User` aggregate. The extra reads
/// (`findByEmail`, `countActiveByRole`) only *feed* domain decisions
/// (uniqueness, last-active-MASTER); the rules themselves live in domain
/// services, never in the database.
export interface UserRepository extends CrudRepository<User> {
  /// Returns the user with the given email, or `ok(null)` when none exists.
  findByEmail(email: string): Promise<Result<User | null>>

  /// Counts active users with the given role (used by `LastMasterPolicy`).
  countActiveByRole(role: UserRole): Promise<Result<number>>
}
