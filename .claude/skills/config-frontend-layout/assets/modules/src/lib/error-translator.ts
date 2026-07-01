/**
 * Mapeamento de códigos de erro (backend) para mensagens formatadas em português.
 * Usado para exibir erros da API de forma amigável ao usuário.
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Value Objects - Validação
  INVALID_CNPJ: 'CNPJ inválido',
  INVALID_CPF: 'CPF inválido',
  INVALID_POSTAL_CODE: 'CEP inválido',
  INVALID_SKU: 'SKU inválido',
  INVALID_EMAIL: 'E-mail inválido',
  INVALID_PERSON_TYPE: 'Tipo de pessoa inválido',
  INVALID_ALIAS: 'Alias inválido',
  INVALID_DOT_SEPARATED_NAME: 'Nome inválido',
  INVALID_NUMBER: 'Número inválido',
  INVALID_ID: 'ID inválido',
  INVALID_PHONE: 'Telefone inválido',

  // Auth / Token
  REFRESH_TOKEN_REQUIRED: 'Refresh token é obrigatório',
  REFRESH_TOKEN_INVALID: 'Refresh token inválido',
  INVALID_TOKEN_VERSION: 'Sua sessão expirou. Entre novamente.',

  // Password / Reset por admin
  PASSWORD_MISMATCH: 'As senhas digitadas não coincidem.',
  WEAK_PASSWORD: 'A senha precisa ter pelo menos 8 caracteres, com maiúscula, minúscula, número e símbolo.',
  CANNOT_RESET_OWN_PASSWORD: 'Use a opção em Perfil para alterar sua própria senha.',
  FORCE_CHANGE_PASSWORD_REQUIRED: 'Defina uma nova senha antes de continuar.',
  USER_NOT_FOUND: 'Usuário não encontrado.',

  // Attachments
  FILE_REQUIRED: 'Arquivo é obrigatório',
  EMPTY_FILE: 'Arquivo vazio',

  // Dashboard
  DASHBOARD_QUERY_FAILED: 'Erro ao carregar dados do dashboard',

  // Catalog / Products
  PRODUCT_SUPPLIES_NOT_ALLOWED: "Apenas produtos do tipo 'Produzido' aceitam insumos na composição",
  PRODUCT_NOT_FOUND: 'Produto não encontrado',
  SUPPLY_NOT_FOUND: 'Insumo não encontrado',
  CATEGORY_NOT_FOUND: 'Categoria não encontrada',
  SUPPLIER_NOT_FOUND: 'Fornecedor não encontrado',
  SECTOR_NOT_FOUND: 'Setor não encontrado',

  // Stock
  SECTORS_MUST_DIFFER: 'Setor de origem e destino devem ser diferentes',
  INSUFFICIENT_SECTOR_BALANCE: 'Saldo insuficiente no setor de origem',
  INSUFFICIENT_GENERAL_BALANCE: 'Saldo insuficiente no estoque geral',
  SECTOR_INACTIVE: 'Setor inativo não aceita movimentações',
  ITEM_NOT_FOUND: 'Item não encontrado',

  // Genéricos
  NOT_FOUND: 'Registro não encontrado',
  DB_ERROR: 'Erro ao processar no banco de dados',
  QUERY_FAILED: 'Erro ao buscar dados',
  UNKNOWN_ERROR: 'Erro desconhecido',
};

/**
 * Traduz um código de erro ou string de erros para mensagem formatada em português.
 *
 * @param error - Código único (ex: "INVALID_RENAVAN") ou múltiplos separados por " | "
 * @returns Mensagem formatada ou o texto original se não houver tradução
 *
 * @example
 * translateError("INVALID_RENAVAN") // "Renavan inválido"
 * translateError("USER_NOT_FOUND | INVALID_EMAIL") // "Usuário não encontrado | E-mail inválido"
 */
export function translateError(error: string | null | undefined): string {
  if (error == null || error === '') {
    return 'Ocorreu um erro.';
  }

  const parts = error
    .split(/\s*\|\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return 'Ocorreu um erro.';

  const translated = parts.map((code) => ERROR_MESSAGES[code] ?? code);

  return translated.join(' | ');
}

/**
 * Registra um novo mapeamento de erro (útil para extensões ou customizações).
 */
export function registerErrorTranslation(code: string, message: string): void {
  ERROR_MESSAGES[code] = message;
}
