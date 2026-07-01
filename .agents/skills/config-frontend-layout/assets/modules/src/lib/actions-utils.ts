import type { ZodError } from 'zod';

import { translateError } from './error-translator';

export type ActionResult<T = null> = { success: true; data: T } | { success: false; error: string };

export function normalizeMutationError(
  error: unknown,
  defaultMessage = 'Ocorreu um erro ao processar a requisição.',
): string {
  if (typeof error === 'string' && error.trim()) {
    return translateError(error);
  }

  if (error instanceof Error) {
    return error.message || defaultMessage;
  }

  if (Array.isArray(error)) {
    return error
      .map((item) => normalizeMutationError(item, defaultMessage))
      .filter(Boolean)
      .join(' | ');
  }

  if (error && typeof error === 'object') {
    if ('errors' in error) {
      return normalizeMutationError((error as { errors?: unknown }).errors, defaultMessage);
    }

    // Caso a API retorne { message: "..." }
    if ('message' in error) {
      const msg = (error as { message?: unknown }).message;
      return typeof msg === 'string' ? translateError(msg) : normalizeMutationError(msg, defaultMessage);
    }
  }

  return defaultMessage;
}

export function getZodErrorMessage(error: ZodError, defaultMessage = 'Dados inválidos.'): string {
  const flattened = error.flatten();
  const firstFieldError = Object.values(flattened.fieldErrors)
    .flat()
    .find((message): message is string => typeof message === 'string');

  return firstFieldError ?? flattened.formErrors[0] ?? defaultMessage;
}
