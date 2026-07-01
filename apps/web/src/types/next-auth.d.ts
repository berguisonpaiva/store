import type { DefaultSession } from 'next-auth';
import type { UserRole } from '@/lib/auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role?: UserRole;
    } & DefaultSession['user'];
    accessToken?: string;
    error?: string;
  }

  interface User {
    role?: UserRole;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: UserRole;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: string;
  }
}
