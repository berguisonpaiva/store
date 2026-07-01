/**
 * Maps backend domain error codes to PT-BR messages for the catalog UI. Codes
 * that belong to a specific field (SKU/barcode/name) are surfaced inline by the
 * forms; anything else becomes a toast via {@link messageForCode}.
 */
export const CATALOG_ERROR_MESSAGES: Record<string, string> = {
  SKU_ALREADY_IN_USE: 'SKU já está em uso por outra variação.',
  BARCODE_ALREADY_IN_USE: 'Código de barras já está em uso.',
  CATEGORY_ALREADY_EXISTS: 'Já existe uma categoria com esse nome.',
  PRODUCT_MUST_HAVE_VARIATION: 'O produto precisa de ao menos uma variação.',
  PRODUCT_NOT_FOUND: 'Produto não encontrado.',
  VARIATION_NOT_FOUND: 'Variação não encontrada.',
  CATEGORY_NOT_FOUND: 'A categoria selecionada não existe.',
  CATEGORY_INACTIVE: 'A categoria selecionada está inativa.',
  INVALID_PRICE: 'O preço informado é inválido.',
  NETWORK_ERROR: 'Não foi possível conectar ao servidor. Tente novamente.',
  INVALID_RESPONSE: 'Resposta inválida do servidor.',
};

/** Codes that should be shown inline on a variation's SKU field. */
export const SKU_FIELD_CODE = 'SKU_ALREADY_IN_USE';
/** Codes that should be shown inline on a variation's barcode field. */
export const BARCODE_FIELD_CODE = 'BARCODE_ALREADY_IN_USE';
/** Code shown inline on the category name field. */
export const CATEGORY_NAME_FIELD_CODE = 'CATEGORY_ALREADY_EXISTS';
/**
 * Codes attributable to the product form's category selector — surfaced inline
 * on that field when identifiable, otherwise as a toast.
 */
export const CATEGORY_FIELD_CODES = ['CATEGORY_NOT_FOUND', 'CATEGORY_INACTIVE'];

export function messageForCode(code: string): string {
  return (
    CATALOG_ERROR_MESSAGES[code] ?? 'Não foi possível concluir a operação.'
  );
}
