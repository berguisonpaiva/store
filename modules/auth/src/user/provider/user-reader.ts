import { Result } from '@repo/shared'
import { User } from '../model'

/// Narrow read port over `User` exposed for other modules (e.g. `auth`):
/// only the by-email lookup, never the full repository.
export interface UserReader {
  findByEmail(email: string): Promise<Result<User | null>>
}
