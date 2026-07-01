import { z } from 'zod';

export const updateProfileNameSchema = z.object({
  name: z.string().trim().min(2, 'Mínimo 2 caracteres').max(120, 'Máximo 120 caracteres'),
});

export const updateProfileAvatarSchema = z.object({
  avatarUrl: z
    .string()
    .trim()
    .max(2048, 'URL muito longa')
    .refine((value) => value === '' || /^https?:\/\//i.test(value), 'Informe uma URL http(s) válida')
    .nullable()
    .or(z.literal('')),
});

export type UpdateProfileAvatarInput = z.infer<typeof updateProfileAvatarSchema>;

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Informe a senha atual'),
    newPassword: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Inclua uma letra maiúscula')
      .regex(/[a-z]/, 'Inclua uma letra minúscula')
      .regex(/[0-9]/, 'Inclua um número')
      .regex(/[^A-Za-z0-9]/, 'Inclua um símbolo'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'A confirmação não coincide com a nova senha',
    path: ['confirmPassword'],
  });

export type UpdateProfileNameInput = z.infer<typeof updateProfileNameSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
