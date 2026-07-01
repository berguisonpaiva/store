import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { JWT } from 'next-auth/jwt';
import { env } from '@/lib/env';
import type { Permission, UserAccountStatus } from '@/types/next-auth';
import { aliasToPermission, domainsToModuleIds } from '@/lib/auth-mappings';

export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  image?: string;
}

type TokenError = 'RefreshTokenExpired' | 'RefreshAccessTokenError';

interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number; // segundos
  /**
   * Estado da sessão emitido pelo backend a partir desta feature.
   * Pode ser ausente em respostas legadas (compat).
   */
  user?: {
    id: string;
    mustChangePassword?: boolean;
  };
}

interface UserDetailResponseDto {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  status?: 'ACTIVE' | 'INACTIVE';
  roles: Array<{ id: string; name: string }>;
  permissions: Array<{
    name: string;
    alias: string;
    criticality: string;
  }>;
  modules: Array<{ id: string; name: string; domain: string }>;
}

interface ExtendedUser extends User {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  email: string;
  permissions?: Permission[];
  modules?: string[];
  roles?: string[];
  status?: UserAccountStatus;
  permissionAliases?: string[];
  mustChangePassword?: boolean;
}

interface ExtendedToken extends JWT {
  id: string;
  role?: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpires: number;
  lastRefreshAt?: number;
  error?: TokenError;
  permissions?: Permission[];
  modules?: string[];
  roles?: string[];
  status?: UserAccountStatus;
  permissionAliases?: string[];
  mustChangePassword?: boolean;
}

const REFRESH_BEFORE_EXPIRY_MS = 5 * 60 * 1000;
const REFRESH_LOCK_TIMEOUT_MS = 15_000;

const refreshLocks = new Map<string, Promise<ExtendedToken>>();

/**
 * Backend base URL. `NEXT_PUBLIC_SERVER_URL` é obrigatório em produção —
 * em dev caímos para `http://localhost:3333`. A trailing slash é removida
 * para evitar URLs com `//api/...` ao concatenar com rotas que começam
 * com `/`.
 */
const API_BASE = (
  env.NEXT_PUBLIC_SERVER_URL ||
  (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development'
    ? 'http://localhost:3333'
    : 'http://localhost:3333')
).replace(/\/+$/, '');

if (process.env.NODE_ENV === 'production' && (!env.NEXT_PUBLIC_SERVER_URL || API_BASE === 'http://localhost:3333')) {
  console.warn(
    '[auth] NEXT_PUBLIC_SERVER_URL ausente em produção — autenticação vai falhar. Defina a var no painel do deploy.',
  );
}

function decodeJwtExpMs(jwt?: string): number | null {
  if (!jwt) return null;
  try {
    const [, payload] = jwt.split('.');
    if (!payload) return null;
    const json = parseJwtPayload(payload);
    if (!json?.exp) return null;
    return Number(json.exp) * 1000; // exp é em segundos
  } catch {
    return null;
  }
}

function parseJwtPayload(payload: string): Record<string, unknown> | null {
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
  let decoded: string;
  if (typeof Buffer !== 'undefined') {
    decoded = Buffer.from(padded, 'base64').toString('utf8');
  } else {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    decoded = new TextDecoder().decode(bytes);
  }
  return JSON.parse(decoded) as Record<string, unknown>;
}

async function fetchProfile(accessToken: string): Promise<UserDetailResponseDto | null> {
  try {
    const response = await fetch(`${API_BASE}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    if (!response.ok) return null;
    return (await response.json()) as UserDetailResponseDto;
  } catch {
    return null;
  }
}

async function authenticateUser(email: string, password: string): Promise<ExtendedUser | null> {
  const loginUrl = `${API_BASE}/api/auth/login`;
  try {
    const loginRes = await fetch(loginUrl, {
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    });

    if (!loginRes.ok) {
      // Log em qualquer ambiente — sem body para não vazar credenciais.
      // 401 = credencial inválida, 5xx = backend com problema, timeout = rede.
      console.warn(`[auth] login falhou: ${loginRes.status} ${loginRes.statusText} @ ${loginUrl}`);
      return null;
    }

    const tokens = (await loginRes.json()) as AuthTokenResponse;
    if (!tokens?.accessToken || !tokens?.refreshToken) {
      console.warn('[auth] login 200 sem tokens esperados (accessToken/refreshToken)');
      return null;
    }

    const expiresAt = decodeJwtExpMs(tokens.accessToken) ?? Date.now() + 1000 * (tokens.expiresIn ?? 86400);

    const profile = await fetchProfile(tokens.accessToken);
    if (!profile?.id) {
      let payload: Record<string, unknown> | null = null;
      try {
        payload = parseJwtPayload(tokens.accessToken.split('.')[1] ?? '');
      } catch {
        /* fallback para dados mínimos */
      }
      const sub = (payload?.sub as string) ?? '';
      const name = (payload?.name as string) ?? email.split('@')[0] ?? '';
      const jwtEmail = (payload?.email as string) ?? email;
      return {
        id: sub,
        name,
        email: jwtEmail,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt,
        permissions: [],
        modules: [],
        roles: [],
        status: undefined,
        permissionAliases: [],
      };
    }

    const permissionAliases = [
      ...new Set((profile.permissions ?? []).map((p) => p.alias?.trim()).filter((a): a is string => Boolean(a))),
    ];

    const permissions: Permission[] = (profile.permissions ?? [])
      .map((p) => aliasToPermission(p.alias))
      .filter((p): p is Permission => p != null);

    const modules = domainsToModuleIds((profile.modules ?? []).map((m) => m.domain));
    const roles = (profile.roles ?? []).map((r) => r.name);
    const role = roles[0] ?? undefined;

    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      image: profile.avatarUrl ?? undefined,
      role,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt,
      permissions,
      modules,
      roles,
      status: profile.status,
      permissionAliases,
      mustChangePassword: tokens.user?.mustChangePassword ?? false,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[auth] exceção chamando ${loginUrl}: ${message}`);
    return null;
  }
}

async function refreshWithLock(token: ExtendedToken): Promise<ExtendedToken> {
  const key = token.refreshToken || 'default';
  const existing = refreshLocks.get(key);
  if (existing) return existing;

  const refresh = refreshAccessToken({
    ...token,
    lastRefreshAt: Date.now(),
  });

  const timeout = new Promise<ExtendedToken>((resolve) => {
    setTimeout(() => resolve({ ...token, error: 'RefreshAccessTokenError' }), REFRESH_LOCK_TIMEOUT_MS);
  });

  const promise = Promise.race([refresh, timeout]);
  refreshLocks.set(key, promise);
  try {
    return await promise;
  } finally {
    refreshLocks.delete(key);
  }
}

async function refreshAccessToken(token: ExtendedToken): Promise<ExtendedToken> {
  try {
    const response = await fetch(`${API_BASE}/api/auth/refresh`, {
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      body: JSON.stringify({ refreshToken: token.refreshToken }),
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        console.warn('[auth] refresh token rejeitado (401/403) - sessão expirada, faça login novamente');
        return { ...token, error: 'RefreshTokenExpired' };
      }
      console.warn(`[auth] refresh token falhou: ${response.status} - RefreshAccessTokenError`);
      return { ...token, error: 'RefreshAccessTokenError' };
    }

    const tokens = (await response.json()) as AuthTokenResponse;
    if (!tokens?.accessToken || !tokens?.refreshToken) {
      console.warn('[auth] refresh retornou resposta inválida (sem token)');
      return { ...token, error: 'RefreshAccessTokenError' };
    }

    const expiresAt = decodeJwtExpMs(tokens.accessToken) ?? Date.now() + 1000 * (tokens.expiresIn ?? 86400);

    return {
      ...token,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessTokenExpires: expiresAt,
      lastRefreshAt: Date.now(),
      error: undefined,
      // Atualiza o flag a partir da resposta do refresh: depois que o usuário
      // troca a senha em /perfil/trocar-senha-obrigatoria, o próximo refresh
      // traz `mustChangePassword=false` e o proxy libera o resto do app.
      mustChangePassword: tokens.user?.mustChangePassword ?? token.mustChangePassword,
    };
  } catch {
    return { ...token, error: 'RefreshAccessTokenError' };
  }
}

export const authConfig: NextAuthConfig = {
  secret: env.AUTH_SECRET || undefined,

  pages: { signIn: '/login' },

  trustHost: true,

  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        const authResult = await authenticateUser(email, password);
        if (!authResult) return null;

        return {
          id: authResult.id,
          name: authResult.name,
          role: authResult.role,
          email: authResult.email,
          image: authResult.image,
          accessToken: authResult.accessToken,
          refreshToken: authResult.refreshToken,
          expiresAt: authResult.expiresAt,
          permissions: authResult.permissions,
          modules: authResult.modules,
          roles: authResult.roles ?? (authResult.role ? [authResult.role] : undefined),
          status: authResult.status,
          permissionAliases: authResult.permissionAliases,
          mustChangePassword: authResult.mustChangePassword ?? false,
        } as ExtendedUser;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const u = user as ExtendedUser & {
          role?: string;
          accessToken: string;
          refreshToken: string;
          expiresAt: number;
          permissions?: Permission[];
          modules?: string[];
          status?: UserAccountStatus;
          permissionAliases?: string[];
        };

        return {
          ...token,
          id: u.id,
          name: u.name,
          image: u.image,
          role: u.role,
          email: u.email ?? '',
          accessToken: u.accessToken,
          refreshToken: u.refreshToken,
          accessTokenExpires: u.expiresAt,
          lastRefreshAt: Date.now(),
          error: undefined,
          permissions: u.permissions ?? [],
          modules: u.modules ?? [],
          roles: u.roles,
          status: u.status,
          permissionAliases: u.permissionAliases ?? [],
          mustChangePassword: u.mustChangePassword ?? false,
        } satisfies ExtendedToken;
      }

      if (trigger === 'update' && session?.user) {
        return {
          ...(token as ExtendedToken),
          image: session.user.image ?? (token.image as string | undefined),
          name: session.user.name ?? token.name,
          email: session.user.email ?? (token as ExtendedToken).email ?? '',
        };
      }

      const ext = token as ExtendedToken;

      // ✅ se refresh já expirou, não insiste (evita loop)
      if (ext.error === 'RefreshTokenExpired') return ext;

      // ✅ se não tem refresh token, não tem o que fazer
      if (!ext.refreshToken) return ext;

      const now = Date.now();
      const expiresAt = Number(ext.accessTokenExpires || 0);

      // ✅ debounce: evita várias renovações em sequência no SSR
      if (ext.lastRefreshAt && now - ext.lastRefreshAt < 10_000) {
        return ext;
      }

      // ✅ se não tem expiresAt, tenta inferir do exp do JWT
      if (!expiresAt) {
        const inferred = decodeJwtExpMs(ext.accessToken);
        if (inferred && inferred > now) {
          return { ...ext, accessTokenExpires: inferred };
        }
        return await refreshWithLock(ext);
      }

      // ✅ token já expirado: refresh imediato
      if (now >= expiresAt) return await refreshWithLock(ext);

      // ✅ só renova perto do vencimento (ex.: 5 min antes)
      const shouldRefresh = now >= expiresAt - REFRESH_BEFORE_EXPIRY_MS;
      if (!shouldRefresh) return ext;

      return await refreshWithLock(ext);
    },

    async session({ session, token }) {
      const ext = token as ExtendedToken;

      if (session.user) {
        session.user.id = ext.id ?? '';
        session.user.name = token.name ?? null;
        session.user.email = ext.email ?? null;
        session.user.image = token.image as string | null | undefined;
        session.user.role = ext.role;
        session.user.mustChangePassword = ext.mustChangePassword ?? false;

        session.accessToken = ext.accessToken;
        session.error = ext.error;
        session.permissions = ext.permissions ?? [];
        session.modules = ext.modules ?? [];
        session.roles = ext.roles;
        session.status = ext.status;
        session.permissionAliases = ext.permissionAliases ?? [];
      }

      return session;
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 7,
  },
};
