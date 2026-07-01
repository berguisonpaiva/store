import { CrudRepository, Result } from '@repo/shared'
import { User } from '../model'

/// Persistence contract for the `User` aggregate. The extra read
/// (`findByEmail`) only *feeds* a domain decision (uniqueness); the rule
/// itself lives in a domain service, never in the database.
export interface UserRepository extends CrudRepository<User> {
  /// Returns the user with the given email, or `ok(null)` when none exists.
  findByEmail(email: string): Promise<Result<User | null>>
}
