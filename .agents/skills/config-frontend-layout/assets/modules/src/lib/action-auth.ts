import { auth } from './auth';

type AuthorizeOptions = {
  anyOf?: readonly string[];
  allOf?: readonly string[];
};

export type AuthorizeFailure = { success: false; error: string };

type SessionShape = {
  user?: unknown;
  error?: string;
  status?: string;
  permissionAliases?: string[];
};

export function evaluateAuthorization(
  session: SessionShape | null,
  options: AuthorizeOptions = {},
): AuthorizeFailure | null {
  if (!session?.user) {
    return { success: false, error: 'Sessão expirada. Faça login novamente.' };
  }
  if (session.error === 'RefreshTokenExpired') {
    return { success: false, error: 'Sessão expirada. Faça login novamente.' };
  }
  if (session.status === 'INACTIVE') {
    return { success: false, error: 'Conta inativa. Contate o administrador.' };
  }

  const aliases = new Set(session.permissionAliases ?? []);
  const anyOf = options.anyOf ?? [];
  const allOf = options.allOf ?? [];

  if (anyOf.length > 0 && !anyOf.some((a) => aliases.has(a))) {
    return { success: false, error: 'Sem permissão para esta operação.' };
  }
  if (allOf.length > 0 && !allOf.every((a) => aliases.has(a))) {
    return { success: false, error: 'Sem permissão para esta operação.' };
  }

  return null;
}

/**
 * Valida autenticação/autorização em Server Actions.
 * Retorna `null` quando autorizado, ou `AuthorizeFailure` caso contrário.
 * Não confie só no middleware de rota: actions podem ser invocadas por POST direto.
 */
export async function authorizeAction(options: AuthorizeOptions = {}): Promise<AuthorizeFailure | null> {
  const session = (await auth()) as SessionShape | null;
  return evaluateAuthorization(session, options);
}
