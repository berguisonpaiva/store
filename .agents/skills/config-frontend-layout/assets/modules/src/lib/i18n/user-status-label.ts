/**
 * Tradução pt-BR do enum `UserStatus` exposto pelo backend.
 * Substitua qualquer renderização inline de `status === "ACTIVE" ? ...` por
 * esta função para evitar enums crus em produção.
 */
export type UserStatusValue = 'ACTIVE' | 'INACTIVE';

const USER_STATUS_LABELS: Record<UserStatusValue, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
};

export function userStatusLabel(status: string | null | undefined): string {
  if (!status) return '—';
  const upper = status.toUpperCase() as UserStatusValue;
  return USER_STATUS_LABELS[upper] ?? status;
}
