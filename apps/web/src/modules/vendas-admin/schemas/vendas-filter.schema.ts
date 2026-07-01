import { z } from 'zod';
import type { ListVendasParams, VendaStatus } from '../data/types';

/**
 * Read schema for the ADMIN "Vendas" listing filters. The filters live in the
 * URL query string (operator/session/period/status) and are parsed server-side
 * into `ListVendasParams` for `GET /vendas`. Kept as a Zod schema so the parse
 * is a single validated boundary (mirrors the `caixas-admin` read-schema
 * convention).
 */

export const VENDA_STATUS_VALUES = [
  'ABERTA',
  'CONCLUIDA',
  'CANCELADA',
] as const;

const searchParamValue = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((value) => (Array.isArray(value) ? value[0] : value));

export const vendasFilterSchema = z.object({
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
  sessaoCaixaId: searchParamValue.transform((value) =>
    value && value.trim() ? value : undefined,
  ),
  status: searchParamValue.transform((value) =>
    value === 'ABERTA' || value === 'CONCLUIDA' || value === 'CANCELADA'
      ? (value as VendaStatus)
      : undefined,
  ),
  startDate: searchParamValue.transform((value) =>
    value && value.trim() ? value : undefined,
  ),
  endDate: searchParamValue.transform((value) =>
    value && value.trim() ? value : undefined,
  ),
});

export type VendasFilterInput = Record<string, string | string[] | undefined>;

/** Parse raw `searchParams` into validated `GET /vendas` filters. */
export function parseVendasFilter(raw: VendasFilterInput): ListVendasParams {
  return vendasFilterSchema.parse(raw);
}
