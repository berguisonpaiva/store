import { z } from 'zod';

/**
 * Espelha a política `StrongPassword` do backend
 * (`apps/backend/src/shared/vo/strong-password.vo.ts`): ≥8 chars,
 * pelo menos uma maiúscula, uma minúscula, um dígito e um símbolo.
 *
 * Mensagens em pt-BR para exibição direta no formulário (FR-019).
 */
const strongPasswordSchema = z
  .string()
  .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
  .regex(/[A-Z]/, 'A senha precisa conter pelo menos uma letra maiúscula.')
  .regex(/[a-z]/, 'A senha precisa conter pelo menos uma letra minúscula.')
  .regex(/[0-9]/, 'A senha precisa conter pelo menos um número.')
  .regex(/[^A-Za-z0-9]/, 'A senha precisa conter pelo menos um símbolo (ex.: !@#$%).');

export const resetPasswordSchema = z
  .object({
    newPassword: strongPasswordSchema,
    confirmNewPassword: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'As senhas digitadas não coincidem.',
    path: ['confirmNewPassword'],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
