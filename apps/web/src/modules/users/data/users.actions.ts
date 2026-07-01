'use server';

import { revalidatePath } from 'next/cache';
import { mutate, type ActionResult } from './action-result';
import type { UserDTO, UserRole } from './types';

/**
 * User mutations as Server Actions (ADMIN-only at the backend). On success the
 * users route is revalidated so the list reflects the change.
 */

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

export type UpdateUserInput = {
  name: string;
  email: string;
  role: UserRole;
};

const USERS_ROUTE = '/usuarios';

export async function createUser(
  input: CreateUserInput,
): Promise<ActionResult<UserDTO>> {
  const result = await mutate<UserDTO>('/api/users', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (result.ok) revalidatePath(USERS_ROUTE);
  return result;
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
): Promise<ActionResult<UserDTO>> {
  const result = await mutate<UserDTO>(`/api/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  if (result.ok) revalidatePath(USERS_ROUTE);
  return result;
}

export async function setUserActive(
  id: string,
  active: boolean,
): Promise<ActionResult<UserDTO>> {
  const action = active ? 'activate' : 'deactivate';
  const result = await mutate<UserDTO>(`/api/users/${id}/${action}`, {
    method: 'PATCH',
  });
  if (result.ok) revalidatePath(USERS_ROUTE);
  return result;
}
