import 'server-only';

import { apiJson } from '@/lib/http';
import type {
  ListVendasParams,
  OperatorOption,
  PaginatedResultDTO,
  VendaOutDTO,
} from './types';

/**
 * ADMIN "Vendas" reads (Server Components only). Each call goes through
 * `apiJson`, which attaches the session Bearer token and throws on non-2xx. The
 * backend `RolesGuard` restricts `GET /vendas` and scopes non-ADMIN callers to
 * their own sales (RN03/RN04); ADMIN sees all. The web page guard is defense in
 * depth. This mirrors the sibling `caixas-admin` reads.
 */

function buildVendasQuery(params: ListVendasParams): string {
  const sp = new URLSearchParams();
  sp.set('page', String(params.page));
  sp.set('pageSize', String(params.pageSize));
  if (params.usuarioId) sp.set('usuarioId', params.usuarioId);
  if (params.sessaoCaixaId) sp.set('sessaoCaixaId', params.sessaoCaixaId);
  if (params.status) sp.set('status', params.status);
  if (params.startDate) sp.set('startDate', params.startDate);
  if (params.endDate) sp.set('endDate', params.endDate);
  return sp.toString();
}

/** `GET /vendas` (ADMIN list-all, RN04) with operator/session/period/status filters. */
export async function listVendas(
  params: ListVendasParams,
): Promise<PaginatedResultDTO<VendaOutDTO>> {
  return apiJson<PaginatedResultDTO<VendaOutDTO>>(
    `/api/vendas?${buildVendasQuery(params)}`,
  );
}

/**
 * Operator options for the listing filter and for resolving `usuarioId` → name
 * in the table. Uses the ADMIN users list (same authority as this panel),
 * exactly like `caixas-admin`.
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
