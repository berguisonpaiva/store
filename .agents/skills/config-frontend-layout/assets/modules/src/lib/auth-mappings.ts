import type { Permission } from '@/types/next-auth';
import { modules } from '@/lib/navigation';

const MODULE_ID_SET = new Set(modules.map((m) => m.id));

/**
 * Domínios retornados em `UserDetailResponseDto.modules[].domain` → id usado no front
 * (ids alinhados à API: catalog, settings, inventory, sales).
 * Inclui legado PT-BR por se rotas antigas ainda enviarem esses domínios.
 */
const DOMAIN_ALIASES: Record<string, string> = {
  configuracao: 'settings',
  cadastro: 'catalog',
  estoque: 'inventory',
  financeiro: 'sales',
  config: 'settings',
  cfg: 'settings',
  financial: 'sales',
  stock: 'inventory',
  registration: 'catalog',
};

function normalizeDomainKey(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  try {
    if (/^https?:\/\//i.test(trimmed)) {
      const u = new URL(trimmed);
      const seg = u.pathname.replace(/^\//, '').split('/').filter(Boolean)[0];
      if (seg) return seg.toLowerCase();
      const hostFirst = u.hostname.split('.')[0];
      return (hostFirst || '').toLowerCase();
    }
  } catch {
    /* URL inválida: segue com split manual */
  }
  const first = trimmed.split('/').filter(Boolean)[0] ?? trimmed;
  return first.toLowerCase();
}

/**
 * Converte domínios vindos do GET /api/auth/me em ids de módulo usados no app.
 */
export function domainsToModuleIds(domains: string[]): string[] {
  const out = new Set<string>();
  for (const d of domains) {
    const key = normalizeDomainKey(d);
    if (!key) continue;
    const mapped = DOMAIN_ALIASES[key] ?? key;
    if (MODULE_ID_SET.has(mapped)) out.add(mapped);
  }
  return [...out];
}

/**
 * Converte alias de permissão do backend em tupla CASL { action, subject }.
 * Formatos aceitos: `action:subject`, `escopo.recurso.acao` (último segmento = ação).
 */
export function aliasToPermission(alias: string): Permission | null {
  const a = alias?.trim();
  if (!a) return null;

  const colon = a.indexOf(':');
  if (colon !== -1) {
    const action = a.slice(0, colon).trim();
    const subject = a.slice(colon + 1).trim();
    if (action && subject) return { action, subject };
    return null;
  }

  const dots = a.split('.');
  if (dots.length >= 2) {
    const action = dots[dots.length - 1]?.trim();
    const subject = dots.slice(0, -1).join('.').trim();
    if (action && subject) return { action, subject };
  }

  return null;
}
