'use client';

import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import clsx from 'clsx';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxFieldProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  hasError?: boolean;
  disabled?: boolean;
}

export function ComboboxField({
  options,
  value,
  onChange,
  placeholder = 'Selecionar...',
  emptyMessage = 'Nenhum resultado encontrado.',
  hasError = false,
  disabled = false,
}: ComboboxFieldProps) {
  const [query, setQuery] = useState('');

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = query === '' ? options : options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));

  function handleSelect(option: ComboboxOption | null) {
    onChange(option?.value ?? '');
    setQuery('');
  }

  return (
    // relative no wrapper para o dropdown se posicionar corretamente sem portal
    <div className="relative">
      <Combobox value={selected} onChange={handleSelect} onClose={() => setQuery('')} disabled={disabled}>
        <div className="relative">
          <ComboboxInput
            className={clsx(
              'flex h-10 w-full rounded-lg border bg-transparent px-3 py-1 pr-9 text-sm transition-colors',
              'placeholder:text-muted-foreground',
              'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30',
              'disabled:cursor-not-allowed disabled:opacity-50',
              // Borda: `--border` no light (hairline escuro visível),
              // `dark:border-input` no dark (superfície elevada, bg-input/30 em cima)
              'dark:bg-input/30',
              hasError ? 'border-destructive' : 'border-border dark:border-input',
            )}
            displayValue={(option: ComboboxOption | null) => option?.label ?? ''}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            autoComplete="off"
          />
          <ComboboxButton className="absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground hover:text-foreground disabled:pointer-events-none">
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
          </ComboboxButton>
        </div>

        {/*
          `anchor` usa FloatingUI + portal do Headless UI, escapando de
          qualquer `overflow-hidden` em containers pais (cards, tabelas).
          Sem `anchor`, o dropdown era clipado dentro de cards rounded-xl.
        */}
        <ComboboxOptions
          anchor={{ to: 'bottom start', gap: 4 }}
          className={clsx(
            'z-50 max-h-60 w-(--input-width) overflow-auto rounded-lg border bg-popover p-1',
            'text-popover-foreground shadow-lg shadow-foreground/5',
            'focus:outline-none',
            // animação de entrada/saída via Headless UI data attributes
            'transition-opacity duration-100',
            'data-closed:opacity-0 data-leave:opacity-0',
          )}
        >
          {filtered.length === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">{emptyMessage}</div>
          ) : (
            filtered.map((option) => (
              <ComboboxOption
                key={option.value}
                value={option}
                className={clsx(
                  'group relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
                  'data-focus:bg-accent data-focus:text-accent-foreground',
                  'data-disabled:pointer-events-none data-disabled:opacity-50',
                )}
              >
                <Check className="mr-2 h-4 w-4 shrink-0 invisible group-data-selected:visible" />
                {option.label}
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
      </Combobox>
    </div>
  );
}
