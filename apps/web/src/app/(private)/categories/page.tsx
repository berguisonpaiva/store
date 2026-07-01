import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { CategoriesManager } from '@/modules/catalog/components/categories-manager';
import { listCategories } from '@/modules/catalog/data/catalog.api';
import { parseBool } from '@/modules/catalog/data/price';

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Categories management route (private, ADMIN-only). On load, reads the session
 * and redirects any non-ADMIN to `/dashboard` before rendering (RN07). This is
 * defense in depth over the authoritative backend `RolesGuard`. The `active`
 * status filter is URL state (kept in sync by `nuqs` on the client) and applied
 * server-side; the name search is applied client-side over the returned list.
 */
export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const sp = await searchParams;
  const categories = await listCategories(parseBool(sp.active));
  return <CategoriesManager categories={categories} />;
}
