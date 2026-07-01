import { z } from 'zod';
import type { ListSessoesParams, SessaoCaixaStatus } from '../data/types';

/**
 * Read schema for the ADMIN "Caixas" listing filters. The filters live in the
 * URL query string (operator/period/status) and are parsed server-side into
 * `ListSessoesParams` for `GET /caixa`. Kept as a Zod schema so the parse is a
 * single validated boundary (mirrors the module read-schema convention).
 */

export const SESSAO_STATUS_VALUES = ['ABERTA', 'FECHADA'] as const;

const searchParamValue = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((value) => (Array.isArray(value) ? value[0] : value));

export const caixasFilterSchema = z.object({
  page: searchParamValue.transform((value) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
  }),
  pageSize: searchParamValue.transform((value) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 20;
  }),
  usuarioId: searchParamValue.transform((value) =>
    value && value.trim() ? value : undefined,
  ),
  status: searchParamValue.transform((value) =>
    value === 'ABERTA' || value === 'FECHADA'
      ? (value as SessaoCaixaStatus)
      : undefined,
  ),
  from: searchParamValue.transform((value) =>
    value && value.trim() ? value : undefined,
  ),
  to: searchParamValue.transform((value) =>
    value && value.trim() ? value : undefined,
  ),
});

export type CaixasFilterInput = Record<string, string | string[] | undefined>;

/** Parse raw `searchParams` into validated `GET /caixa` filters. */
export function parseCaixasFilter(raw: CaixasFilterInput): ListSessoesParams {
  return caixasFilterSchema.parse(raw);
}
