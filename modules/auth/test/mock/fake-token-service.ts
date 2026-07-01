import { AuthenticatedUser } from '@repo/shared'
import { AuthUserIdentity, TokenService } from '../../src/auth'

/// Stateful in-memory TokenService for tests: tokens map back to identities.
export class FakeTokenService implements TokenService {
  private readonly access = new Map<string, AuthUserIdentity>()
  private readonly refresh = new Map<string, AuthUserIdentity>()

  async generateAccessToken(identity: AuthUserIdentity): Promise<string> {
    const token = `access-${identity.id}`
    this.access.set(token, identity)
    return token
  }

  async generateRefreshToken(identity: AuthUserIdentity): Promise<string> {
    const token = `refresh-${identity.id}`
    this.refresh.set(token, identity)
    return token
  }

  async validateAccessToken(token: string): Promise<AuthenticatedUser | null> {
    const identity = this.access.get(token)
    if (!identity) return null
    return { id: identity.id, name: identity.name, email: identity.email }
  }

  async validateRefreshToken(token: string): Promise<AuthUserIdentity | null> {
    return this.refresh.get(token) ?? null
  }
}
