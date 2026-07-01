/**
 * Tokens de UI para formulários e ações de página.
 * Usar classes semânticas do Tailwind (border-border, bg-card, text-muted-foreground, etc.)
 * alinhadas ao shadcn/theme em globals.css.
 */

// ——— Botões / listagens ———

/** CTA principal no topo de listagens (mobile full width) */
export const listPagePrimaryActionClassName = 'w-full sm:w-auto';

/** Navegação de paginação em tabelas */
export const tablePaginationNavButtonClassName =
  'h-9 w-9 rounded-xl border-border/70 bg-background/90 shadow-none transition-all hover:bg-muted/70 active:scale-90';

// ——— Superfícies de card em formulário ———

export const formCardSurfaceClassName = 'border border-border/40 bg-card text-card-foreground shadow-none ring-0';

export const formCardHeaderClassName = 'border-b border-border/40 px-4 py-3';

export const formCardTitleClassName = 'text-base font-medium leading-snug';

export const formCardDescriptionClassName = 'text-xs text-muted-foreground';

export const formCardContentClassName = 'py-4';

// ——— Abas em formulário ———

export const formTabsListClassName =
  'w-full justify-start gap-1 rounded-none border-b border-border/40 bg-transparent px-0';

export const formTabsTriggerClassName = 'max-w-fit px-3 text-sm';

// ——— Layout / painéis ———

export const formActionsBarClassName =
  'flex flex-col gap-3 border-t border-border/40 pt-4 sm:flex-row sm:items-center sm:justify-between';

export const formFieldTwoColGridClassName = 'grid gap-4 md:grid-cols-2';

export const formNestedFieldPanelClassName = 'grid gap-3 rounded-lg border border-border/40 bg-muted/10 p-3';

export const formEmptyStateBoxClassName =
  'rounded-lg border border-dashed border-border/60 px-3 py-6 text-center text-sm text-muted-foreground';

export const formPricingPanelClassName = 'rounded-xl border border-border/40 bg-muted/5 p-3';

export const formSubtotalBoxClassName =
  'w-full rounded-md border border-border/40 bg-background/80 px-2.5 py-2 text-xs';

// ——— Modais (Dialog + formulário) ———

/** Borda e fundo padrão para `DialogContent` de formulário */
export const formModalSurfaceClassName = 'border border-border/40 bg-background shadow-lg';

/** Rodapé de modal com Cancelar / Salvar */
export const formModalFooterClassName =
  'flex flex-row justify-end gap-2 border-t border-border/40 bg-muted/10 px-6 py-4 sm:space-x-0';
