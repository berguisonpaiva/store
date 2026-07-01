import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { VendasList } from '@/modules/vendas-admin/components/vendas-list';
import {
  listOperatorOptions,
  listVendas,
} from '@/modules/vendas-admin/data/vendas.api';
import { parseVendasFilter } from '@/modules/vendas-admin/schemas/vendas-filter.schema';

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * ADMIN-only "Vendas" listing (RN04). On load, reads the session and redirects
 * any non-ADMIN to `/dashboard` before fetching any sale data — defense in depth
 * over the authoritative backend `RolesGuard` on `GET /vendas`; hiding the
 * sidebar entry is only UX. This panel is read-only (design.md Decision 7). It
 * mirrors the sibling ADMIN "Caixas" page.
 */
export default async function VendasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const sp = await searchParams;
  const filters = parseVendasFilter(sp);

  const [vendas, operators] = await Promise.all([
    listVendas(filters),
    listOperatorOptions(),
  ]);

  return (
    <VendasList
      vendas={vendas.data}
      meta={vendas.meta}
      operators={operators}
    />
  );
}
