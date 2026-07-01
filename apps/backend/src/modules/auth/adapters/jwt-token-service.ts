import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthenticatedUser } from '@repo/shared';
import { AuthUserIdentity, TokenService, UserRole } from '@repo/auth';

interface AccessClaims {
  sub: string;
  name: string;
  email: string;
  role: UserRole;
}

/// JWT implementation of the domain `TokenService`: short-lived access token
/// (JWT_SECRET / JWT_ACCESS_TTL) + refresh token (JWT_REFRESH_SECRET /
/// JWT_REFRESH_TTL). Tokens are opaque to the domain.
@Injectable()
export class JwtTokenService implements TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  generateAccessToken(identity: AuthUserIdentity): Promise<string> {
    return this.jwt.signAsync(this.claims(identity), {
      secret: this.config.get<string>('JWT_SECRET', 'secret'),
      expiresIn: this.config.get<string>('JWT_ACCESS_TTL', '15m') as any,
    });
  }

  generateRefreshToken(identity: AuthUserIdentity): Promise<string> {
    return this.jwt.signAsync(this.claims(identity), {
      secret: this.config.get<string>('JWT_REFRESH_SECRET', 'refresh-secret'),
      expiresIn: this.config.get<string>('JWT_REFRESH_TTL', '7d') as any,
    });
  }

  async validateAccessToken(token: string): Promise<AuthenticatedUser | null> {
    try {
      const payload = await this.jwt.verifyAsync<AccessClaims>(token, {
        secret: this.config.get<string>('JWT_SECRET', 'secret'),
      });
      return { id: payload.sub, name: payload.name, email: payload.email };
    } catch {
      return null;
    }
  }

  async validateRefreshToken(token: string): Promise<AuthUserIdentity | null> {
    try {
      const payload = await this.jwt.verifyAsync<AccessClaims>(token, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET', 'refresh-secret'),
      });
      return {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        role: payload.role,
      };
    } catch {
      return null;
    }
  }

  private claims(identity: AuthUserIdentity): AccessClaims {
    return {
      sub: identity.id,
      name: identity.name,
      email: identity.email,
      role: identity.role,
    };
  }
}
