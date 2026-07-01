/**
 * User DTOs as returned by the backend auth/users module. The password hash is
 * never present in any payload (RN08); the active state is the boolean `active`
 * (there is no separate status string — "Ativo/Inativo" is derived from it).
 */

export type UserRole = 'ADMIN' | 'OPERADOR';

export type UserDTO = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
};

export type PaginationMetaDTO = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaginatedResultDTO<T> = {
  data: T[];
  meta: PaginationMetaDTO;
};

/** Parsed filters for the users list (mirrors the `nuqs` URL state). */
export type ListUsersParams = {
  page: number;
  pageSize: number;
  role?: UserRole;
  active?: boolean;
};
