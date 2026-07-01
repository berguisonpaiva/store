function getEnvVar(key: string): string {
  const value = process.env[key];
  if (value === undefined || value === '') {
    return '';
  }
  return value;
}

export const env = {
  get NEXT_PUBLIC_SERVER_URL() {
    return getEnvVar('NEXT_PUBLIC_SERVER_URL');
  },
  /**
   * Auth.js / NextAuth — use `AUTH_SECRET` em produção.
   * Aceita `NEXTAUTH_SECRET` (legado) ou `BETTER_AUTH_SECRET` como fallback local.
   */
  get AUTH_SECRET() {
    return getEnvVar('AUTH_SECRET') || getEnvVar('NEXTAUTH_SECRET') || getEnvVar('BETTER_AUTH_SECRET');
  },
} as const;
