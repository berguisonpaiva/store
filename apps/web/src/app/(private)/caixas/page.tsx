import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { SessoesList } from '@/modules/caixas-admin/components/sessoes-list';
import {
  listOperatorOptions,
  listSessoes,
} from '@/modules/caixas-admin/data/caixas.api';
import { parseCaixasFilter } from '@/modules/caixas-admin/schemas/caixas-filter.schema';

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * ADMIN-only "Caixas" listing (RN04). On load, reads the session and redirects
 * any non-ADMIN to `/dashboard` before fetching any session data — defense in
 * depth over the authoritative backend `RolesGuard` on `GET /caixa`; hiding the
 * sidebar entry is only UX. This panel is read-only (design.md Decision 7).
 */
export default async function CaixasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const sp = await searchParams;
  const filters = parseCaixasFilter(sp);

  const [sessoes, operators] = await Promise.all([
    listSessoes(filters),
    listOperatorOptions(),
  ]);

  return (
    <SessoesList
      sessoes={sessoes.data}
      meta={sessoes.meta}
      operators={operators}
    />
  );
}
