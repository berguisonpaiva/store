import clsx from 'clsx';

/**
 * Classes de input padronizadas — mesmo shape que `Input` e `ComboboxField`:
 * h-10, rounded-lg, border-input, focus ring sutil. Única fonte de verdade
 * para altura/raio/padding de campos de formulário.
 */
export function fieldInputClasses(hasError: boolean): string {
  return clsx(
    'flex h-10 w-full rounded-lg border bg-transparent px-3 py-1 text-sm transition-colors',
    'placeholder:text-muted-foreground',
    'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'dark:bg-input/30',
    hasError ? 'border-destructive' : 'border-border dark:border-input',
  );
}
