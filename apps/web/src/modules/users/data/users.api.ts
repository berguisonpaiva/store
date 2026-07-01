import 'server-only';

import { apiJson } from '@/lib/http';
import type {
  ListUsersParams,
  PaginatedResultDTO,
  UserDTO,
} from './types';

/**
 * User reads (Server Components only). Each call goes through `apiJson`, which
 * attaches the session Bearer token and throws on non-2xx. The backend
 * `RolesGuard` restricts these routes to ADMIN; the web guard is defense in
 * depth. The password hash is never returned (RN08).
 */

function buildUsersQuery(params: ListUsersParams): string {
  const sp = new URLSearchParams();
  sp.set('page', String(params.page));
  sp.set('pageSize', String(params.pageSize));
  if (params.role) sp.set('role', params.role);
  if (params.active !== undefined) sp.set('active', String(params.active));
  return sp.toString();
}

export async function listUsers(
  params: ListUsersParams,
): Promise<PaginatedResultDTO<UserDTO>> {
  return apiJson<PaginatedResultDTO<UserDTO>>(
    `/api/users?${buildUsersQuery(params)}`,
  );
}
