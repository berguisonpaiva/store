'use server';

import { revalidatePath } from 'next/cache';
import { mutate, type ActionResult } from './action-result';
import type { CategoryDTO } from './types';

/**
 * Category mutations as Server Actions. On success the catalog routes are
 * revalidated (categories feed the product form's select too).
 */

export type CreateCategoryInput = { name: string; active?: boolean };
export type UpdateCategoryInput = { name?: string };

function revalidateCategories(): void {
  revalidatePath('/categories');
  revalidatePath('/products');
}

export async function createCategory(
  input: CreateCategoryInput,
): Promise<ActionResult<CategoryDTO>> {
  const result = await mutate<CategoryDTO>('/api/categories', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (result.ok) revalidateCategories();
  return result;
}

export async function updateCategory(
  id: string,
  input: UpdateCategoryInput,
): Promise<ActionResult<CategoryDTO>> {
  const result = await mutate<CategoryDTO>(`/api/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  if (result.ok) revalidateCategories();
  return result;
}

export async function setCategoryActive(
  id: string,
  active: boolean,
): Promise<ActionResult<CategoryDTO>> {
  const action = active ? 'activate' : 'deactivate';
  const result = await mutate<CategoryDTO>(`/api/categories/${id}/${action}`, {
    method: 'PATCH',
  });
  if (result.ok) revalidateCategories();
  return result;
}
