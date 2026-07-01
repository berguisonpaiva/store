import 'server-only';

import { apiFetch, apiJson } from '@/lib/http';
import type { MovimentacaoDTO, ResumoSessaoDTO, SessaoOutDTO } from './types';

/**
 * Open session for the current operator. The backend derives the operator from
 * the bearer token; `GET /caixa/aberto` returns the open `SessaoOutDTO` or an
 * empty body / 204 when there is none — both normalize to `null` here.
 */
export async function getOpenSession(): Promise<SessaoOutDTO | null> {
  const res = await apiFetch('/api/caixa/aberto');

  if (res.status === 204 || res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`API ${res.status} for /api/caixa/aberto`);
  }

  const text = await res.text();
  if (!text.trim()) {
    return null;
  }

  const parsed = JSON.parse(text) as SessaoOutDTO | null | Record<string, never>;
  if (!parsed || !('id' in parsed) || !parsed.id) {
    return null;
  }
  return parsed as SessaoOutDTO;
}

export async function getSessionResumo(sessaoId: string): Promise<ResumoSessaoDTO> {
  return apiJson<ResumoSessaoDTO>(`/api/caixa/${sessaoId}/resumo`);
}

export async function listSessionMovimentacoes(
  sessaoId: string,
): Promise<MovimentacaoDTO[]> {
  // The backend returns a paginated envelope `{ data, meta }` (shared
  // PaginatedResultDTO), so unwrap `.data` into the bare list the UI expects.
  const page = await apiJson<{ data: MovimentacaoDTO[] }>(
    `/api/caixa/${sessaoId}/movimentacoes`,
  );
  return page.data ?? [];
}

export function isApiStatusError(error: unknown, status: number): boolean {
  return error instanceof Error && error.message.startsWith(`API ${status} `);
}
