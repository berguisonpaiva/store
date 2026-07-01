import type { SessaoOutDTO } from './types';

export type CashView = 'abrir' | 'sessao-ativa';

/**
 * Pure decision for the cash screen: no open session → show only the "Abrir
 * caixa" CTA; an open session → show the active-session panel. Centralized so
 * the page and the tests share one source of truth for the branching.
 */
export function resolveCashView(openSession: SessaoOutDTO | null): CashView {
  return openSession ? 'sessao-ativa' : 'abrir';
}
