/**
 * Stable cash-session domain error codes surfaced by the backend (read from the
 * error body the same way every module does — see catalog `mutate`). The web UI
 * maps these to user messages and to blocking behavior:
 *
 * - `CASH_SESSION_ALREADY_OPEN` (409) — blocks "Abrir" and surfaces the active
 *   session (the page refetches `/caixa/aberto`).
 * - `CASH_SESSION_NOT_FOUND` (404) — the session id is stale; refetch state.
 * - `CASH_SESSION_ALREADY_CLOSED` (409) — the session was already closed.
 * - `PENDING_SALE_IN_SESSION` (422) — blocks closing with an "há venda aberta"
 *   warning.
 */
export const CASH_SESSION_ALREADY_OPEN = 'CASH_SESSION_ALREADY_OPEN';
export const CASH_SESSION_NOT_FOUND = 'CASH_SESSION_NOT_FOUND';
export const CASH_SESSION_ALREADY_CLOSED = 'CASH_SESSION_ALREADY_CLOSED';
export const PENDING_SALE_IN_SESSION = 'PENDING_SALE_IN_SESSION';

export function messageForCode(code: string): string {
  switch (code) {
    case CASH_SESSION_ALREADY_OPEN:
      return 'Já existe um caixa aberto para este operador.';
    case CASH_SESSION_NOT_FOUND:
      return 'A sessão de caixa não foi encontrada. Atualize a tela.';
    case CASH_SESSION_ALREADY_CLOSED:
      return 'Este caixa já foi fechado.';
    case PENDING_SALE_IN_SESSION:
      return 'Há venda aberta nesta sessão. Conclua ou cancele a venda antes de fechar o caixa.';
    case 'OPERATION_NOT_ALLOWED_FOR_ROLE':
      return 'Seu perfil não tem permissão para esta operação.';
    case 'NETWORK_ERROR':
      return 'Não foi possível falar com o backend. Verifique a conexão.';
    case 'INVALID_RESPONSE':
      return 'O backend respondeu com um formato inesperado.';
    default:
      return 'Não foi possível concluir a operação. Tente novamente.';
  }
}
