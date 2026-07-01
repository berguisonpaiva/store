import { AuthenticatedUser } from '@repo/shared'
import { UserRole } from '../../user'

/// Identity embedded into tokens.
export interface AuthUserIdentity {
  id: string
  name: string
  email: string
  role: UserRole
}

/// Port for opaque token generation/validation (implemented with JWT in infra).
/// The domain treats tokens as opaque strings.
export interface TokenService {
  generateAccessToken(identity: AuthUserIdentity): Promise<string>
  generateRefreshToken(identity: AuthUserIdentity): Promise<string>

  /// Returns the authenticated user, or `null` when the token is invalid.
  validateAccessToken(token: string): Promise<AuthenticatedUser | null>

  /// Returns the embedded identity, or `null` when the token is invalid.
  validateRefreshToken(token: string): Promise<AuthUserIdentity | null>
}
