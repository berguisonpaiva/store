import type { CategoryDTO } from '../data/types';

/**
 * Form value shape + inline validation rules for the category form (RHF, no
 * Zod). Name uniqueness is decided by the backend (409 →
 * `CATEGORY_NAME_ALREADY_IN_USE`), surfaced inline on the name field.
 */

export type CategoryFormValues = {
  name: string;
};

export const CATEGORY_NAME_RULES = {
  required: 'Informe o nome da categoria.',
  minLength: { value: 2, message: 'O nome deve ter ao menos 2 caracteres.' },
} as const;

export function categoryFormDefaults(category?: CategoryDTO): CategoryFormValues {
  return { name: category?.name ?? '' };
}
