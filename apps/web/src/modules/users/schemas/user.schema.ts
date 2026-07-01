import { z } from 'zod';
import type { UserDTO } from '../data/types';

/**
 * Zod schemas for the user create/edit forms, validated via `zodResolver`.
 * Email uniqueness is decided by the backend (409 → `EMAIL_ALREADY_IN_USE`),
 * surfaced inline on the email field. The role is restricted to the two-role
 * model (ADMIN/OPERADOR); MASTER was removed.
 */

export const ROLE_OPTIONS = [
  { label: 'Administrador', value: 'ADMIN' },
  { label: 'Operador', value: 'OPERADOR' },
] as const;

/**
 * Mirrors the domain `PersonName` VO (packages/shared): 3–50 chars, at least a
 * first and last name (each ≥ 2 letters), letters/accents/hyphen/apostrophe
 * only. Validating client-side gives inline feedback instead of a confusing
 * server rejection (`MUST_HAVE_FIRST_AND_LAST_NAME`).
 */
const NAME_CHARS = /^[A-Za-zÀ-ÖØ-öø-ÿ'`´^~\- ]+$/;

const nameSchema = z
  .string()
  .trim()
  .min(3, 'O nome deve ter ao menos 3 caracteres.')
  .max(50, 'O nome deve ter no máximo 50 caracteres.')
  .refine((value) => NAME_CHARS.test(value), {
    message: 'Use apenas letras, espaços, hífen e apóstrofo.',
  })
  .refine((value) => value.split(/\s+/).filter(Boolean).length >= 2, {
    message: 'Informe nome e sobrenome.',
  })
  .refine(
    (value) => {
      const words = value.split(/\s+/).filter(Boolean);
      return (
        words.length >= 2 &&
        words[0]!.length >= 2 &&
        words[words.length - 1]!.length >= 2
      );
    },
    { message: 'Nome e sobrenome devem ter ao menos 2 letras cada.' },
  );

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Informe o email.')
  .email('Email inválido.');

const roleSchema = z.enum(['ADMIN', 'OPERADOR'], {
  error: 'Selecione um perfil.',
});

export const createUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: z.string().min(8, 'A senha deve ter ao menos 8 caracteres.'),
  role: roleSchema,
});

export const editUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  role: roleSchema,
});

export type CreateUserFormValues = z.output<typeof createUserSchema>;
export type EditUserFormValues = z.output<typeof editUserSchema>;

export function createUserDefaults(): CreateUserFormValues {
  return { name: '', email: '', password: '', role: 'OPERADOR' };
}

export function editUserDefaults(user?: UserDTO): EditUserFormValues {
  return {
    name: user?.name ?? '',
    email: user?.email ?? '',
    role: user?.role ?? 'OPERADOR',
  };
}
