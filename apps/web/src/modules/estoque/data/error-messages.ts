export const VARIATION_FIELD_CODE = 'VARIACAO_NAO_ENCONTRADA';
export const QUANTITY_FIELD_CODE = 'QUANTIDADE_INVALIDA';
export const INSUFFICIENT_STOCK_CODE = 'ESTOQUE_INSUFICIENTE';

export function messageForCode(code: string): string {
  switch (code) {
    case VARIATION_FIELD_CODE:
      return 'Selecione uma variacao valida.';
    case QUANTITY_FIELD_CODE:
      return 'Informe uma quantidade valida maior que zero.';
    case INSUFFICIENT_STOCK_CODE:
      return 'A quantidade informada excede o saldo disponivel.';
    case 'OPERATION_NOT_ALLOWED_FOR_ROLE':
      return 'Seu perfil nao tem permissao para esta operacao.';
    case 'NETWORK_ERROR':
      return 'Nao foi possivel falar com o backend. Verifique a conexao.';
    case 'INVALID_RESPONSE':
      return 'O backend respondeu com um formato inesperado.';
    default:
      return 'Nao foi possivel concluir a operacao. Tente novamente.';
  }
}
