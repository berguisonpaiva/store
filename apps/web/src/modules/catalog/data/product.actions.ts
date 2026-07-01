'use server';

import { revalidatePath } from 'next/cache';
import { mutate, type ActionResult } from './action-result';
import type { AttributeMap, ProductDTO } from './types';

/**
 * Product + variation mutations as Server Actions. Prices arrive already in
 * integer cents (the client converts the decimal input). On success the
 * relevant routes are revalidated; the caller handles navigation/toast.
 */

export type VariationInput = {
  sku: string;
  barcode?: string | null;
  attributes?: AttributeMap;
  price: number; // integer cents
  minStock?: number;
  active?: boolean;
};

export type CreateProductInput = {
  name: string;
  description?: string | null;
  categoryId?: string | null;
  active?: boolean;
  variations: VariationInput[];
};

export type UpdateProductInput = {
  name?: string;
  description?: string | null;
  categoryId?: string | null;
};

export type UpdateVariationInput = {
  sku?: string;
  barcode?: string | null;
  attributes?: AttributeMap;
  price?: number; // integer cents
  minStock?: number;
};

function revalidateProducts(id?: string): void {
  revalidatePath('/products');
  if (id) revalidatePath(`/products/${id}`);
}

export async function createProduct(
  input: CreateProductInput,
): Promise<ActionResult<ProductDTO>> {
  const result = await mutate<ProductDTO>('/api/products', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (result.ok) revalidateProducts(result.data.id);
  return result;
}

export async function updateProduct(
  id: string,
  input: UpdateProductInput,
): Promise<ActionResult<ProductDTO>> {
  const result = await mutate<ProductDTO>(`/api/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  if (result.ok) revalidateProducts(id);
  return result;
}

export async function setProductActive(
  id: string,
  active: boolean,
): Promise<ActionResult<ProductDTO>> {
  const action = active ? 'activate' : 'deactivate';
  const result = await mutate<ProductDTO>(`/api/products/${id}/${action}`, {
    method: 'PATCH',
  });
  if (result.ok) revalidateProducts(id);
  return result;
}

export async function addVariation(
  productId: string,
  input: VariationInput,
): Promise<ActionResult<ProductDTO>> {
  const result = await mutate<ProductDTO>(
    `/api/products/${productId}/variations`,
    { method: 'POST', body: JSON.stringify(input) },
  );
  if (result.ok) revalidateProducts(productId);
  return result;
}

export async function updateVariation(
  productId: string,
  variationId: string,
  input: UpdateVariationInput,
): Promise<ActionResult<ProductDTO>> {
  const result = await mutate<ProductDTO>(
    `/api/products/${productId}/variations/${variationId}`,
    { method: 'PATCH', body: JSON.stringify(input) },
  );
  if (result.ok) revalidateProducts(productId);
  return result;
}

export async function setVariationActive(
  productId: string,
  variationId: string,
  active: boolean,
): Promise<ActionResult<ProductDTO>> {
  const action = active ? 'activate' : 'deactivate';
  const result = await mutate<ProductDTO>(
    `/api/products/${productId}/variations/${variationId}/${action}`,
    { method: 'PATCH' },
  );
  if (result.ok) revalidateProducts(productId);
  return result;
}
