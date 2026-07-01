import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ProductsList } from '@/modules/catalog/components/products-list';
import {
  listCategories,
  listProducts,
} from '@/modules/catalog/data/catalog.api';
import {
  parseBool,
  parsePositiveInt,
  parseString,
} from '@/modules/catalog/data/price';

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Products list (private, ADMIN-only). On load, reads the session and redirects
 * any non-ADMIN to `/dashboard` before rendering (RN07) — defense in depth over
 * the authoritative backend `RolesGuard`. Server Component: parses the URL
 * search params, fetches the paginated list + categories with the session
 * Bearer token, and hands them to the client list (which owns the `nuqs` filter
 * state).
 */
export default async function ProductsPage({
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
    name: parseString(sp.name),
    categoryId: parseString(sp.categoryId),
    active: parseBool(sp.active),
  };

  const [products, categories] = await Promise.all([
    listProducts(params),
    listCategories(),
  ]);

  return (
    <ProductsList
      products={products.data}
      meta={products.meta}
      categories={categories}
    />
  );
}
