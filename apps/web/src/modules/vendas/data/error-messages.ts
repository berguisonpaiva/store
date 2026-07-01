/**
 * Stable PDV sale (vendas) domain error codes surfaced by the backend (read
 * from the `{ message: [CODE] }` body the shared `mutate` helper normalizes).
 * The UI maps these to user messages and to a blocking/UI behavior:
 *
 * - `NO_OPEN_CASH_SESSION` (422) — blocks the whole screen and guides the
 *   operator to open a cash drawer.
 * - `INSUFFICIENT_STOCK` (422) — highlights the offending item.
 * - `PAYMENT_MISMATCH` (422) — keeps finalization blocked until Σ pagamentos = total.
 * - `SALE_ALREADY_FINALIZED` (409) — switches the sale UI to read-only.
 * - `SALE_NOT_FOUND` (404) — the sale id is stale; refetch / restart.
 */
export const NO_OPEN_CASH_SESSION = 'NO_OPEN_CASH_SESSION';
export const INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK';
export const PAYMENT_MISMATCH = 'PAYMENT_MISMATCH';
export const SALE_ALREADY_FINALIZED = 'SALE_ALREADY_FINALIZED';
export const SALE_NOT_FOUND = 'SALE_NOT_FOUND';

export function messageForCode(code: string): string {
  switch (code) {
    case NO_OPEN_CASH_SESSION:
      return 'Você não tem um caixa aberto. Abra um caixa antes de vender.';
    case INSUFFICIENT_STOCK:
      return 'Estoque insuficiente para um dos itens da venda.';
    case PAYMENT_MISMATCH:
      return 'A soma dos pagamentos deve ser igual ao total da venda.';
    case SALE_ALREADY_FINALIZED:
      return 'Esta venda já foi finalizada e não pode mais ser alterada.';
    case SALE_NOT_FOUND:
      return 'A venda não foi encontrada. Atualize a tela.';
    case 'VARIATION_NOT_FOUND':
      return 'Produto não encontrado para o termo informado.';
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

/**
 * The UI behavior a sale error code triggers (besides a toast). Centralized so
 * the screen and tests share one source of truth for the branching.
 */
export type SaleErrorState =
  | 'blocked'
  | 'read-only'
  | 'highlight-item'
  | 'payment-mismatch'
  | 'toast';

export function resolveSaleErrorState(code: string): SaleErrorState {
  switch (code) {
    case NO_OPEN_CASH_SESSION:
      return 'blocked';
    case SALE_ALREADY_FINALIZED:
      return 'read-only';
    case INSUFFICIENT_STOCK:
      return 'highlight-item';
    case PAYMENT_MISMATCH:
      return 'payment-mismatch';
    default:
      return 'toast';
  }
}
