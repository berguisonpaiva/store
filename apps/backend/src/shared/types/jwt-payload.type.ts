import { UserRole } from '@repo/auth';

export type JwtPayload = {
  sub: string;
  name: string;
  email: string;
  role?: UserRole;
  iat?: number;
  exp?: number;
};
