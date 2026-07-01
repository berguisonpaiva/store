import { httpClient } from '@/lib/http-client';

export interface ResetUserPasswordPayload {
  newPassword: string;
  confirmNewPassword: string;
}

/**
 * Reseta a senha de um usuário-alvo (admin). Backend retorna 204 No Content
 * em caso de sucesso — não exibe a senha em nenhuma forma. Erros são lançados
 * como `APIError` e traduzidos por `translateError` no consumidor.
 *
 * Requer alias `settings.user.reset_password` na sessão.
 */
export async function resetUserPasswordByAdmin(userId: string, payload: ResetUserPasswordPayload): Promise<void> {
  await httpClient({
    path: `/users/${userId}/reset-password`,
    options: {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  });
}
