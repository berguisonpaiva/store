import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { UsersManager } from '@/modules/users/components/users-manager';
import { listUsers } from '@/modules/users/data/users.api';
import type { UserRole } from '@/modules/users/data/types';

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePositiveInt(
  value: string | string[] | undefined,
  fallback: number,
): number {
  const parsed = Number(firstValue(value));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseRole(value: string | string[] | undefined): UserRole | undefined {
  const raw = firstValue(value);
  return raw === 'ADMIN' || raw === 'OPERADOR' ? raw : undefined;
}

function parseBool(value: string | string[] | undefined): boolean | undefined {
  const raw = firstValue(value);
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return undefined;
}

/**
 * Users management route (private, ADMIN-only). On load, reads the session and
 * redirects any non-ADMIN to `/dashboard` before rendering any user data
 * (RN07). This is defense in depth over the authoritative backend `RolesGuard`.
 */
export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const sp = await searchParams;
  const params = {
    page: parsePositiveInt(sp.page, 1),
    pageSize: parsePositiveInt(sp.pageSize, 20),
    role: parseRole(sp.role),
    active: parseBool(sp.active),
  };

  const users = await listUsers(params);

  return <UsersManager users={users.data} meta={users.meta} />;
}
