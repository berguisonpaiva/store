import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { SessaoDetail } from '@/modules/caixas-admin/components/sessao-detail';
import {
  getSessao,
  getSessionResumo,
  listOperatorOptions,
  listSessionMovimentacoes,
  listSessionVendas,
} from '@/modules/caixas-admin/data/caixas.api';
import type {
  MovimentacaoDTO,
  OperatorOption,
  ResumoSessaoDTO,
  SessaoOutDTO,
  VendaOutDTO,
} from '@/modules/caixas-admin/data/types';

/**
 * ADMIN-only "Caixas" session detail (RN04/RN05). On load, redirects any
 * non-ADMIN to `/dashboard` before fetching any session data — defense in depth
 * over the authoritative backend `RolesGuard`. Read-only: shows the abertura/
 * fechamento, sangrias/suprimentos, the automatic resumo and the linked sales
 * with no edit controls (design.md Decision 7). 404s when the session is unknown.
 */
export default async function CaixaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const { id } = await params;

  // Fetch inside try/catch (a missing session 404s); construct the JSX outside
  // it so render-time errors are not swallowed by this catch.
  let sessao: SessaoOutDTO;
  let resumo: ResumoSessaoDTO;
  let movimentacoes: MovimentacaoDTO[];
  let vendas: VendaOutDTO[];
  let operators: OperatorOption[];
  try {
    [sessao, resumo, movimentacoes, vendas, operators] = await Promise.all([
      getSessao(id),
      getSessionResumo(id),
      listSessionMovimentacoes(id),
      listSessionVendas(id),
      listOperatorOptions(),
    ]);
  } catch {
    notFound();
  }

  const operatorName =
    operators.find((op) => op.id === sessao.operadorId)?.name ??
    sessao.operadorId;

  return (
    <SessaoDetail
      sessao={sessao}
      resumo={resumo}
      movimentacoes={movimentacoes}
      vendas={vendas}
      operatorName={operatorName}
    />
  );
}
