/**
 * Maps backend domain error codes to PT-BR messages for the users UI. The
 * duplicate-email code is surfaced inline on the email field by the forms;
 * anything else becomes a toast via {@link messageForCode}.
 */
export const USERS_ERROR_MESSAGES: Record<string, string> = {
  EMAIL_ALREADY_IN_USE: 'Já existe um usuário com esse email.',
  MUST_HAVE_FIRST_AND_LAST_NAME: 'Informe nome e sobrenome.',
  NAME_TOO_SHORT: 'O nome é muito curto (mín. 3 caracteres; nome e sobrenome com ao menos 2 letras cada).',
  NAME_TOO_LONG: 'O nome deve ter no máximo 50 caracteres.',
  CANNOT_DEACTIVATE_SELF: 'Você não pode desativar o próprio usuário.',
  USER_NOT_FOUND: 'Usuário não encontrado.',
  OPERATION_NOT_ALLOWED_FOR_ROLE: 'Você não tem permissão para esta ação.',
  INVALID_ROLE: 'Perfil inválido.',
  NETWORK_ERROR: 'Não foi possível conectar ao servidor. Tente novamente.',
  INVALID_RESPONSE: 'Resposta inválida do servidor.',
};

/** Code shown inline on the email field. */
export const EMAIL_FIELD_CODE = 'EMAIL_ALREADY_IN_USE';

/** Codes shown inline on the name field (domain `PersonName` rejections). */
export const NAME_FIELD_CODES = [
  'MUST_HAVE_FIRST_AND_LAST_NAME',
  'NAME_TOO_SHORT',
  'NAME_TOO_LONG',
] as const;

export function messageForCode(code: string): string {
  return USERS_ERROR_MESSAGES[code] ?? 'Não foi possível concluir a operação.';
}
