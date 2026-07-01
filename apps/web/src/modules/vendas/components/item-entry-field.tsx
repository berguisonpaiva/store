'use client';

import { useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormErrorMessage } from '@/components/ui/form-error-message';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  addItemDefaults,
  addItemSchema,
  type AddItemFormValues,
} from '../schemas/vendas.schema';
import type { AddItemInput, VariationOption } from '../data/types';

type ItemEntryFieldProps = {
  options: VariationOption[];
  disabled?: boolean;
  /** Resolves the typed/selected term into the add-item payload and submits it. */
  onAdd: (input: AddItemInput) => Promise<void> | void;
};

/**
 * Single entry field accepting SKU / scanned barcode (bip) / name autocomplete.
 * The form holds the raw `termo` (text or picked variation id) via `Controller`;
 * a known option maps to `variacaoId`, a digits-only term to `codigoBarras`,
 * anything else to `sku`. Adding an item never reloads — it calls `onAdd` and
 * returns focus to the field (RF: bip + focus return).
 */
const ENTRY_ID = 'venda-item-entry';

function focusEntry() {
  const el = document.getElementById(ENTRY_ID) as HTMLInputElement | null;
  el?.focus();
}

export function ItemEntryField({ options, disabled, onAdd }: ItemEntryFieldProps) {
  const [open, setOpen] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AddItemFormValues>({
    resolver: zodResolver(addItemSchema),
    defaultValues: addItemDefaults(),
  });

  const termo = useWatch({ control, name: 'termo' });

  const suggestions = useMemo(() => {
    const q = termo.trim().toLowerCase();
    if (!q) return [];
    return options
      .filter((o) =>
        [o.label, o.sku, o.barcode ?? ''].join(' ').toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [options, termo]);

  function resolveInput(term: string, quantidade: number): AddItemInput {
    const trimmed = term.trim();
    const byOption = options.find(
      (o) => o.variacaoId === trimmed || o.sku === trimmed || o.barcode === trimmed,
    );
    if (byOption) return { variacaoId: byOption.variacaoId, quantidade };
    if (/^\d{6,}$/.test(trimmed)) return { codigoBarras: trimmed, quantidade };
    return { sku: trimmed, quantidade };
  }

  const submit = handleSubmit(async (values) => {
    await onAdd(resolveInput(values.termo, values.quantidade));
    reset(addItemDefaults());
    setOpen(false);
    focusEntry();
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-1.5">
      <Label htmlFor={ENTRY_ID}>SKU, código de barras ou produto</Label>
      <div className="flex items-start gap-2">
        <div className="relative flex-1">
          <Controller
            control={control}
            name="termo"
            render={({ field }) => (
              <Input
                id={ENTRY_ID}
                ref={field.ref}
                autoFocus
                autoComplete="off"
                placeholder="Bipe o código de barras ou busque pelo nome"
                disabled={disabled}
                value={field.value}
                onChange={(e) => {
                  field.onChange(e.target.value);
                  setOpen(true);
                }}
                onBlur={() => {
                  field.onBlur();
                  // Delay so a suggestion click registers before closing.
                  window.setTimeout(() => setOpen(false), 120);
                }}
                aria-invalid={!!errors.termo}
                aria-expanded={open && suggestions.length > 0}
                role="combobox"
              />
            )}
          />
          {open && suggestions.length > 0 ? (
            <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-popover p-1 shadow-md">
              {suggestions.map((o) => (
                <li key={o.variacaoId}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent',
                    )}
                    onClick={() => {
                      setValue('termo', o.variacaoId, { shouldValidate: true });
                      setOpen(false);
                      focusEntry();
                    }}
                  >
                    <span>{o.label}</span>
                    <span className="text-xs text-muted-foreground">{o.sku}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <Controller
          control={control}
          name="quantidade"
          render={({ field }) => (
            <Input
              type="number"
              min={1}
              step={1}
              aria-label="Quantidade"
              className="w-20"
              disabled={disabled}
              value={field.value}
              onChange={(e) => field.onChange(Number(e.target.value))}
            />
          )}
        />

        <Button type="submit" disabled={disabled}>
          <Plus className="size-4" />
          Adicionar
        </Button>
      </div>
      {errors.termo ? (
        <FormErrorMessage>{errors.termo.message}</FormErrorMessage>
      ) : null}
      {errors.quantidade ? (
        <FormErrorMessage>{errors.quantidade.message}</FormErrorMessage>
      ) : null}
    </form>
  );
}
