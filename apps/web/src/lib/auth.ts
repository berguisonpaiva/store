import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { decodeJwt } from 'jose';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type AccessClaims = {
  sub: string;
  name?: string;
  email?: string;
  role?: string;
  exp?: number;
};

async function refreshAccessToken(token: any) {
  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
    });
    if (!res.ok) throw new Error('refresh failed');
    const { accessToken } = (await res.json()) as { accessToken: string };
    const claims = decodeJwt(accessToken) as AccessClaims;
    return {
      ...token,
      accessToken,
      accessTokenExpires: (claims.exp ?? 0) * 1000,
      error: undefined,
    };
  } catch {
    return { ...token, error: 'RefreshFailed' as const };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: { signIn: '/join' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) return null;

        const { accessToken, refreshToken } = (await res.json()) as {
          accessToken: string;
          refreshToken: string;
        };
        const claims = decodeJwt(accessToken) as AccessClaims;

        return {
          id: claims.sub,
          name: claims.name ?? null,
          email: claims.email ?? email,
          role: claims.role,
          accessToken,
          refreshToken,
          accessTokenExpires: (claims.exp ?? 0) * 1000,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as any;
        token.id = u.id;
        token.role = u.role;
        token.accessToken = u.accessToken;
        token.refreshToken = u.refreshToken;
        token.accessTokenExpires = u.accessTokenExpires;
        return token;
      }

      const expires = (token as any).accessTokenExpires as number | undefined;
      if (expires && Date.now() < expires - 5_000) {
        return token;
      }
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.user.id = (token as any).id;
      session.user.role = (token as any).role;
      session.accessToken = (token as any).accessToken;
      session.error = (token as any).error;
      return session;
    },
  },
});
