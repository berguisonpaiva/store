import { auth } from '@/lib/auth';
import { AbrirCaixaForm } from '@/modules/caixa/components/abrir-caixa-form';
import { SessaoAtivaPanel } from '@/modules/caixa/components/sessao-ativa-panel';
import {
  getOpenSession,
  getSessionResumo,
  listSessionMovimentacoes,
} from '@/modules/caixa/data/caixa.api';
import { resolveCashView } from '@/modules/caixa/data/cash-view';

/** Roles allowed to operate the cash register from the UI. The backend is the
 *  real authority (it derives the operator from the token and gates server-side);
 *  this only hides/disables actions for roles that clearly cannot operate. */
const OPERATOR_ROLES = new Set(['MASTER', 'ADMIN', 'OPERADOR', 'CAIXA', 'VENDEDOR']);

export default async function CaixaPage() {
  const session = await auth();
  const role = session?.user?.role;
  const canOperate = role === undefined || OPERATOR_ROLES.has(role);

  const openSession = await getOpenSession();

  if (resolveCashView(openSession) === 'abrir' || !openSession) {
    return <AbrirCaixaForm canOperate={canOperate} />;
  }

  const [resumo, movimentacoes] = await Promise.all([
    getSessionResumo(openSession.id),
    listSessionMovimentacoes(openSession.id),
  ]);

  return (
    <SessaoAtivaPanel
      sessao={openSession}
      resumo={resumo}
      movimentacoes={movimentacoes}
      canOperate={canOperate}
    />
  );
}
