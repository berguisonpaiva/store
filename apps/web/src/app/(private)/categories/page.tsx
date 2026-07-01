import { CategoriesManager } from '@/modules/catalog/components/categories-manager';
import { listCategories } from '@/modules/catalog/data/catalog.api';
import { parseBool } from '@/modules/catalog/data/price';

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Categories management route (private). The `active` status filter is URL
 * state (kept in sync by `nuqs` on the client) and applied server-side; the
 * name search is applied client-side over the returned list.
 */
export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const categories = await listCategories(parseBool(sp.active));
  return <CategoriesManager categories={categories} />;
}
