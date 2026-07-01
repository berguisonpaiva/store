/**
 * Tradução pt-BR das ações de auditoria expostas pelo backend
 * (`AuditLog.action` é uma string). Estende quando novos verbos forem
 * adicionados em `apps/backend/src/modules/audit/domain/audit-event.ts`.
 */
const AUDIT_ACTION_LABELS: Record<string, string> = {
  create: 'Criação',
  update: 'Atualização',
  delete: 'Exclusão',
  login: 'Login',
  logout: 'Logout',
  activate: 'Ativação',
  deactivate: 'Inativação',
  // Eventos por evento de domínio
  'audit.user.created': 'Criação de usuário',
  'audit.user.updated': 'Atualização de usuário',
  'audit.user.deleted': 'Exclusão de usuário',
  'audit.user.activated': 'Ativação de usuário',
  'audit.user.deactivated': 'Inativação de usuário',
  'audit.user.password_reset_by_admin': 'Reset de senha por admin',
  'audit.role.created': 'Criação de perfil',
  'audit.role.updated': 'Atualização de perfil',
  'audit.role.deleted': 'Exclusão de perfil',
  'audit.auth.login': 'Login',
  'audit.auth.logout': 'Logout',
};

export function auditActionLabel(action: string | null | undefined): string {
  if (!action) return '—';
  const lower = action.toLowerCase();
  return AUDIT_ACTION_LABELS[lower] ?? AUDIT_ACTION_LABELS[action] ?? action;
}
