import { toast } from 'sonner';

import { normalizeMutationError } from '@/lib/actions-utils';

type ShowErrorToastOptions = {
  fallbackMessage?: string;
  title?: string;
};

export function showErrorToast(error: unknown, options: ShowErrorToastOptions = {}) {
  const { fallbackMessage = 'Tente novamente em instantes.', title = 'Não foi possível concluir a ação' } = options;

  toast.error(title, {
    description: normalizeMutationError(error, fallbackMessage),
  });
}

type ShowSuccessToastOptions = {
  description?: string;
};

export function showSuccessToast(title: string, options: ShowSuccessToastOptions = {}) {
  const { description } = options;
  toast.success(title, description ? { description } : undefined);
}

export function showWarningToast(title: string, options: ShowSuccessToastOptions = {}) {
  const { description } = options;
  toast.warning(title, description ? { description } : undefined);
}
