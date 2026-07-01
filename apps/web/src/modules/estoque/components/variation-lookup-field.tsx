'use client';

import { Badge } from '@/components/ui/badge';
import { Combobox } from '@/components/ui/combobox';
import { FormErrorMessage } from '@/components/ui/form-error-message';
import { Label } from '@/components/ui/label';
import type { InventoryVariationOption } from '../data/types';

type VariationLookupFieldProps = {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  options: InventoryVariationOption[];
  placeholder?: string;
  error?: string;
  description?: string;
};

export function VariationLookupField({
  label = 'Variacao',
  value,
  onChange,
  options,
  placeholder = 'Buscar por produto, SKU ou atributos',
  error,
  description,
}: VariationLookupFieldProps) {
  const selected = options.find((option) => option.value === value);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Combobox
        options={options.map((option) => ({
          value: option.value,
          label: option.label,
        }))}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        emptyText="Nenhuma variacao encontrada."
      />
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
      {selected ? (
        <div className="rounded-md border border-border/80 bg-muted/25 p-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={selected.active && selected.productActive ? 'default' : 'secondary'}>
              {selected.active && selected.productActive ? 'Ativa' : 'Inativa'}
            </Badge>
            <span className="font-medium">{selected.productName}</span>
          </div>
          <p className="mt-2 text-muted-foreground">
            SKU {selected.sku}
            {selected.barcode ? ` · Codigo ${selected.barcode}` : ''}
          </p>
          <p className="mt-1 text-muted-foreground">
            {selected.variationSummary || 'Sem atributos cadastrados.'}
          </p>
        </div>
      ) : null}
      {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
    </div>
  );
}
