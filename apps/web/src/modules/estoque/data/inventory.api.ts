import 'server-only';

import { cache } from 'react';
import { apiJson } from '@/lib/http';
import { getProduct, listProducts } from '@/modules/catalog/data/catalog.api';
import type { ProductDTO, ProductListItemDTO } from '@/modules/catalog/data/types';
import type {
  InventoryBalanceDTO,
  InventoryLowStockItemDTO,
  InventoryMovementsResultDTO,
  InventoryVariationOption,
  ListInventoryMovementsParams,
} from './types';

function appendIfPresent(sp: URLSearchParams, key: string, value?: string): void {
  if (value?.trim()) {
    sp.set(key, value);
  }
}

function buildVariationSummary(product: ProductDTO, variation: ProductDTO['variations'][number]): string {
  const attrs = Object.entries(variation.attributes);
  const attrsLabel = attrs.length
    ? attrs.map(([key, value]) => `${key}: ${value}`).join(' / ')
    : 'Sem atributos';
  return `${product.name} · SKU ${variation.sku} · ${attrsLabel}`;
}

async function listAllProductsIndex(): Promise<ProductListItemDTO[]> {
  const firstPage = await listProducts({ page: 1, pageSize: 100 });
  const items = [...firstPage.data];

  if (firstPage.meta.totalPages > 1) {
    const remainingPages = await Promise.all(
      Array.from({ length: firstPage.meta.totalPages - 1 }, (_, index) =>
        listProducts({
          page: index + 2,
          pageSize: 100,
        }),
      ),
    );

    for (const page of remainingPages) {
      items.push(...page.data);
    }
  }

  return items;
}

export const listInventoryVariationOptions = cache(async (): Promise<InventoryVariationOption[]> => {
  const productsIndex = await listAllProductsIndex();
  const products = await Promise.all(productsIndex.map((product) => getProduct(product.id)));

  return products
    .flatMap((product) =>
      product.variations.map((variation) => ({
        value: variation.id,
        label: buildVariationSummary(product, variation),
        sku: variation.sku,
        barcode: variation.barcode,
        productName: product.name,
        variationSummary: Object.entries(variation.attributes)
          .map(([key, value]) => `${key}: ${value}`)
          .join(' / '),
        active: variation.active,
        productActive: product.active,
      })),
    )
    .sort((left, right) => left.label.localeCompare(right.label, 'pt-BR'));
});

export async function getInventoryBalance(
  variationId: string,
): Promise<InventoryBalanceDTO> {
  return apiJson<InventoryBalanceDTO>(
    `/api/inventory/variations/${variationId}/balance`,
  );
}

export async function listInventoryMovements(
  params: ListInventoryMovementsParams,
): Promise<InventoryMovementsResultDTO> {
  const sp = new URLSearchParams();
  sp.set('page', String(params.page));
  sp.set('pageSize', String(params.pageSize));
  appendIfPresent(sp, 'from', params.from);
  appendIfPresent(sp, 'to', params.to);

  return apiJson<InventoryMovementsResultDTO>(
    `/api/inventory/variations/${params.variacaoId}/movements?${sp.toString()}`,
  );
}

export async function listLowStockItems(): Promise<InventoryLowStockItemDTO[]> {
  return apiJson<InventoryLowStockItemDTO[]>('/api/inventory/low-stock');
}

export function isApiStatusError(error: unknown, status: number): boolean {
  return error instanceof Error && error.message.startsWith(`API ${status} `);
}
