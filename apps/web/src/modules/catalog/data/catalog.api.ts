import 'server-only';

import { apiJson } from '@/lib/http';
import type {
  CategoryDTO,
  ListProductsParams,
  PaginatedResultDTO,
  ProductDTO,
  ProductListItemDTO,
  VariationLookupDTO,
} from './types';

/**
 * Catalog reads (Server Components only). Each call goes through `apiJson`,
 * which attaches the session Bearer token and throws on non-2xx. The backend
 * is the source of truth; these helpers only shape the query string.
 */

function buildProductsQuery(params: ListProductsParams): string {
  const sp = new URLSearchParams();
  sp.set('page', String(params.page));
  sp.set('pageSize', String(params.pageSize));
  if (params.name) sp.set('name', params.name);
  if (params.categoryId) sp.set('categoryId', params.categoryId);
  if (params.active !== undefined) sp.set('active', String(params.active));
  return sp.toString();
}

export async function listProducts(
  params: ListProductsParams,
): Promise<PaginatedResultDTO<ProductListItemDTO>> {
  return apiJson<PaginatedResultDTO<ProductListItemDTO>>(
    `/api/products?${buildProductsQuery(params)}`,
  );
}

export async function getProduct(id: string): Promise<ProductDTO> {
  return apiJson<ProductDTO>(`/api/products/${id}`);
}

export async function findVariationBySku(
  sku: string,
): Promise<VariationLookupDTO> {
  return apiJson<VariationLookupDTO>(
    `/api/variations/by-sku/${encodeURIComponent(sku)}`,
  );
}

export async function findVariationByBarcode(
  barcode: string,
): Promise<VariationLookupDTO> {
  return apiJson<VariationLookupDTO>(
    `/api/variations/by-barcode/${encodeURIComponent(barcode)}`,
  );
}

export async function listCategories(active?: boolean): Promise<CategoryDTO[]> {
  const query = active === undefined ? '' : `?active=${active}`;
  return apiJson<CategoryDTO[]>(`/api/categories${query}`);
}
