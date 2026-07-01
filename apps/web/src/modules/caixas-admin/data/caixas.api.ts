import 'server-only';

import { apiJson } from '@/lib/http';
import type {
  ListSessoesParams,
  MovimentacaoDTO,
  OperatorOption,
  PaginatedResultDTO,
  ResumoSessaoDTO,
  SessaoOutDTO,
  VendaOutDTO,
} from './types';

/**
 * ADMIN "Caixas" reads (Server Components only). Each call goes through
 * `apiJson`, which attaches the session Bearer token and throws on non-2xx. The
 * backend `RolesGuard` restricts `GET /caixa` to ADMIN (RN04) and scopes the
 * per-session reads (owner or ADMIN); the web page guard is defense in depth.
 */

function buildSessoesQuery(params: ListSessoesParams): string {
  const sp = new URLSearchParams();
  sp.set('page', String(params.page));
  sp.set('pageSize', String(params.pageSize));
  if (params.usuarioId) sp.set('usuarioId', params.usuarioId);
  if (params.status) sp.set('status', params.status);
  if (params.from) sp.set('from', params.from);
  if (params.to) sp.set('to', params.to);
  return sp.toString();
}

/** `GET /caixa` (ADMIN list-all, RN04) with operator/period/status filters. */
export async function listSessoes(
  params: ListSessoesParams,
): Promise<PaginatedResultDTO<SessaoOutDTO>> {
  return apiJson<PaginatedResultDTO<SessaoOutDTO>>(
    `/api/caixa?${buildSessoesQuery(params)}`,
  );
}

export async function getSessao(sessaoId: string): Promise<SessaoOutDTO> {
  // There is no `GET /caixa/:id`; the list is the single source for a session.
  // A one-item filtered listing returns the row for the detail header.
  const page = await apiJson<PaginatedResultDTO<SessaoOutDTO>>(
    `/api/caixa?page=1&pageSize=100`,
  );
  const found = page.data.find((session) => session.id === sessaoId);
  if (!found) {
    throw new Error(`API 404 for /api/caixa/${sessaoId}`);
  }
  return found;
}

export async function getSessionResumo(
  sessaoId: string,
): Promise<ResumoSessaoDTO> {
  return apiJson<ResumoSessaoDTO>(`/api/caixa/${sessaoId}/resumo`);
}

export async function listSessionMovimentacoes(
  sessaoId: string,
): Promise<MovimentacaoDTO[]> {
  // The backend returns a paginated envelope `{ data, meta }`; unwrap `.data`
  // into the bare list the read view expects.
  const page = await apiJson<{ data: MovimentacaoDTO[] }>(
    `/api/caixa/${sessaoId}/movimentacoes?page=1&pageSize=100`,
  );
  return page.data ?? [];
}

/**
 * Sales linked to a session. The backend exposes them via
 * `GET /vendas?sessaoCaixaId=<id>` (ADMIN sees all operators' sales); there is
 * no dedicated `GET /caixa/:id/vendas` route.
 */
export async function listSessionVendas(
  sessaoId: string,
): Promise<VendaOutDTO[]> {
  const page = await apiJson<PaginatedResultDTO<VendaOutDTO>>(
    `/api/vendas?sessaoCaixaId=${encodeURIComponent(sessaoId)}&page=1&pageSize=100`,
  );
  return page.data ?? [];
}

/**
 * Operator options for the listing filter and for resolving `operadorId` →
 * name in the tables. Uses the ADMIN users list (same authority as this panel).
 */
export async function listOperatorOptions(): Promise<OperatorOption[]> {
  const page = await apiJson<{ data: { id: string; name: string }[] }>(
    `/api/users?page=1&pageSize=100`,
  );
  return (page.data ?? []).map((user) => ({ id: user.id, name: user.name }));
}

export function isApiStatusError(error: unknown, status: number): boolean {
  return error instanceof Error && error.message.startsWith(`API ${status} `);
}
