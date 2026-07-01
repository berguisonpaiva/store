'use server';

import { revalidatePath } from 'next/cache';
import { resetUserPasswordByAdmin } from '@/http/users/reset-password';
import { resetPasswordSchema, type ResetPasswordInput } from '@/schemas/reset-password';

export interface ResetPasswordActionResult {
  ok: boolean;
  /** Código bruto vindo do backend (mapeado para pt-BR no cliente via translateError). */
  errorCode?: string;
  /** Mensagem amigável em pt-BR vinda da camada de tradução. */
  errorMessage?: string;
}

export async function resetUserPasswordAction(
  userId: string,
  input: ResetPasswordInput,
): Promise<ResetPasswordActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      errorCode: 'VALIDATION_ERROR',
      errorMessage: parsed.error.issues[0]?.message ?? 'Entrada inválida.',
    };
  }

  try {
    await resetUserPasswordByAdmin(userId, parsed.data);
    revalidatePath('/configuracao/usuarios');
    return { ok: true };
  } catch (err) {
    const code =
      err instanceof Error && 'code' in err
        ? String((err as { code?: string }).code ?? err.message)
        : 'RESET_PASSWORD_FAILED';
    const message = err instanceof Error ? err.message : 'Erro inesperado.';
    return {
      ok: false,
      errorCode: code,
      errorMessage: message,
    };
  }
}
