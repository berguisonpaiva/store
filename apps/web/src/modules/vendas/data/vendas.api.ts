import 'server-only';

import { apiJson } from '@/lib/http';
import { listProducts } from '@/modules/catalog/data/catalog.api';
import { getProduct } from '@/modules/catalog/data/catalog.api';
import { getOpenSession } from '@/modules/caixa/data/caixa.api';
import type { SessaoOutDTO } from '@/modules/caixa/data/types';
import type { ResumoVendasOutDTO, VariationOption, VendaOutDTO } from './types';

/**
 * Vendas reads (Server Components only). Each call goes through `apiJson`, which
 * attaches the session Bearer token and throws on non-2xx; mutations live in
 * `vendas.actions.ts`. The backend is the source of truth.
 */

export async function getVenda(id: string): Promise<VendaOutDTO> {
  return apiJson<VendaOutDTO>(`/api/vendas/${id}`);
}

export async function getVendasResumo(query = ''): Promise<ResumoVendasOutDTO> {
  const suffix = query ? `?${query}` : '';
  return apiJson<ResumoVendasOutDTO>(`/api/vendas/resumo${suffix}`);
}

/** Re-export so the page can gate the screen on an open cash session. */
export async function getOperatorOpenSession(): Promise<SessaoOutDTO | null> {
  return getOpenSession();
}

/**
 * Active variations offered as autocomplete options in the item-entry combobox.
 * The catalog exposes products with their variations; we flatten the active
 * ones into entry options (SKU/barcode/name lookups resolve the same ids).
 */
export async function listVariationOptions(): Promise<VariationOption[]> {
  // Page through the active products (a counter sale has a bounded catalog;
  // the backend caps page size). One page is enough for the autocomplete seed.
  const page = await listProducts({ page: 1, pageSize: 100, active: true });

  const products = await Promise.all(page.data.map((item) => getProduct(item.id)));

  const options: VariationOption[] = [];
  for (const product of products) {
    if (!product.active) continue;
    for (const variation of product.variations) {
      if (!variation.active) continue;
      options.push({
        variacaoId: variation.id,
        sku: variation.sku,
        barcode: variation.barcode,
        label: `${product.name} · ${variation.sku}`,
        price: variation.price,
      });
    }
  }
  return options;
}
