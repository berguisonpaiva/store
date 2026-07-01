'use client';

import { Search, X, Calendar, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { parseAsString, parseAsIsoDateTime, useQueryStates, debounce } from 'nuqs';
import { useTransition, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-variants';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type FilterFieldType = 'text' | 'select' | 'date' | 'dateRange';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterField {
  key: string;
  label: string;
  type: FilterFieldType;
  placeholder?: string;
  options?: FilterOption[];
  icon?: React.ReactNode;
  width?: string;
  // nuqs ParserBuilder tem variância contravariante; o tipo exato não é
  // exportado da lib em um formato compatível com objeto dinâmico.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parser?: any;
}

export interface ActiveFilter {
  key: string;
  label: string;
  value: string;
  displayValue: string;
}

interface DataFilterProps {
  fields: FilterField[];
  className?: string;
  actions?: React.ReactNode;
  /**
   * Quantos filtros ficam visíveis antes do botão "Mais filtros".
   * @default 3
   */
  visibleCount?: number;
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function DataFilter({ fields, className, actions, visibleCount = 3 }: DataFilterProps) {
  const [, startTransition] = useTransition();
  const [accordionOpen, setAccordionOpen] = useState(false);

  // Dividir campos em principais e extras
  const mainFields = fields.slice(0, visibleCount);
  const extraFields = fields.slice(visibleCount);
  const hasExtra = extraFields.length > 0;

  // Criar parsers dinamicamente para cada campo
  const parsers = fields.reduce(
    (acc, field) => {
      let parser = field.parser;
      if (!parser) {
        switch (field.type) {
          case 'text':
          case 'select':
            parser = parseAsString.withDefault('');
            break;
          case 'date':
            parser = parseAsIsoDateTime;
            break;
          case 'dateRange':
            parser = parseAsString;
            break;
          default:
            parser = parseAsString.withDefault('');
        }
      }
      acc[field.key] = parser;
      return acc;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    {} as Record<string, any>,
  );

  const [filters, setFiltersRaw] = useQueryStates(parsers, {
    shallow: false,
    startTransition,
  });

  const [, setPage] = useQueryStates({ page: parseAsString }, { shallow: false, startTransition });

  // Toda alteração de filtro precisa voltar para a primeira página — caso
  // contrário o usuário pode ficar numa página inexistente (ex.: filtrando
  // estando na página 5 com resultado de 2 páginas).
  const setFilters: typeof setFiltersRaw = (...args) => {
    setPage({ page: null });
    return setFiltersRaw(...args);
  };

  // Converter dateRange de string para objeto
  const values = { ...filters };
  fields.forEach((field) => {
    if (field.type === 'dateRange' && typeof values[field.key] === 'string') {
      try {
        values[field.key] = JSON.parse(values[field.key]);
      } catch {
        values[field.key] = null;
      }
    }
  });

  // Quantidade de filtros extras ativos (para badge)
  const activeExtraCount = extraFields.filter((f) => {
    const v = values[f.key];
    return v !== null && v !== '' && v !== 'all';
  }).length;

  // Total de filtros ativos (todos os campos)
  const totalActiveCount = fields.filter((f) => {
    const v = values[f.key];
    return v !== null && v !== '' && v !== 'all';
  }).length;

  const handleClearFilter = (key: string) => {
    setFilters({ [key]: null });
  };

  const handleClearAll = () => {
    const reset = fields.reduce((acc, f) => ({ ...acc, [f.key]: null }), {});
    setFilters(reset);
  };

  const handleChange = (
    key: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options?: any,
  ) => {
    const field = fields.find((f) => f.key === key);
    if (field?.type === 'dateRange') {
      setFilters({ [key]: value ? JSON.stringify(value) : null });
    } else if (field?.type === 'text' && options?.limitUrlUpdates) {
      setFilters({ [key]: value }, { history: 'push', ...options });
    } else {
      setFilters({ [key]: value });
    }
  };

  // ─── Render de cada campo ─────────────────────────────────────────────────

  const renderField = (field: FilterField) => {
    const value = values[field.key];

    switch (field.type) {
      case 'text':
        return (
          <div key={field.key} className={cn('relative flex-1 min-w-[180px]', field.width)}>
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {field.icon ?? <Search className="size-4" />}
            </span>
            <Input
              id={`filter-${field.key}`}
              type="text"
              placeholder={field.placeholder ?? `Pesquisar ${field.label.toLowerCase()}...`}
              value={value || ''}
              onChange={(e) => {
                handleChange(field.key, e.target.value, {
                  limitUrlUpdates: e.target.value === '' ? undefined : debounce(300),
                });
              }}
              className={cn('h-9 pl-9 text-sm bg-background border-border', value ? 'pr-9' : 'pr-3')}
            />
            {value && (
              <button
                type="button"
                onClick={() => handleClearFilter(field.key)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Limpar"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.key} className={cn('relative flex-1 min-w-[150px]', field.width)}>
            {field.icon && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10">
                {field.icon}
              </span>
            )}
            <Select
              value={value === 'all' || !value ? 'all' : value}
              onValueChange={(v) => handleChange(field.key, v === 'all' ? null : v)}
            >
              <SelectTrigger
                id={`filter-${field.key}`}
                className={cn('h-9 w-full text-sm bg-background border-border', field.icon ? 'pl-9' : 'pl-3')}
              >
                <SelectValue
                  placeholder={
                    <span className={cn('text-muted-foreground', field.width)}>
                      {field.placeholder ?? `Selecione ${field.label.toLowerCase()}`}
                    </span>
                  }
                >
                  <span className={cn('text-muted-foreground', field.width)}>
                    {value === 'all' || !value
                      ? (field.placeholder ?? `Selecione ${field.label.toLowerCase()}`)
                      : field.options?.find((o) => o.value === value)?.label}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {field.options?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'date':
        return (
          <div key={field.key} className={cn('flex-1 min-w-[160px]', field.width)}>
            <Popover>
              <PopoverTrigger
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'lg' }),
                  'h-9 w-full justify-start text-sm font-normal bg-background border-border',
                  !value && 'text-muted-foreground',
                )}
              >
                <Calendar className="mr-2 size-4 shrink-0" />
                {value ? (
                  format(new Date(value), 'dd/MM/yyyy', { locale: ptBR })
                ) : (
                  <span>{field.placeholder ?? 'Selecione uma data'}</span>
                )}
                {value && (
                  <X
                    className="ml-auto size-3.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearFilter(field.key);
                    }}
                  />
                )}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={value ? new Date(value) : undefined}
                  onSelect={(date) => handleChange(field.key, date?.toISOString())}
                  locale={ptBR}
                  autoFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        );

      case 'dateRange':
        return (
          <div key={field.key} className={cn('flex-1 min-w-[200px]', field.width)}>
            <Popover>
              <PopoverTrigger
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'lg' }),
                  'h-9 w-full justify-start text-sm font-normal bg-background border-border',
                  !value?.from && 'text-muted-foreground',
                )}
              >
                <Calendar className="mr-2 size-4 shrink-0" />
                {value?.from ? (
                  value.to ? (
                    <>
                      {format(value.from, 'dd/MM/yy')} – {format(value.to, 'dd/MM/yy')}
                    </>
                  ) : (
                    format(value.from, 'dd/MM/yyyy')
                  )
                ) : (
                  <span>{field.placeholder ?? 'Selecione período'}</span>
                )}
                {value?.from && (
                  <X
                    className="ml-auto size-3.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearFilter(field.key);
                    }}
                  />
                )}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="range"
                  selected={value}
                  onSelect={(range) => handleChange(field.key, range)}
                  locale={ptBR}
                  numberOfMonths={2}
                  autoFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        );

      default:
        return null;
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={cn('rounded-xl bg-card shadow-sm', className)}>
      {/* Linha principal */}
      <div className="flex items-center gap-2 flex-wrap px-3 py-2">
        {/* Filtros principais */}
        {mainFields.map(renderField)}

        {/* Botão "Mais filtros" — só aparece se há campos extras */}
        {hasExtra && (
          <Button
            type="button"
            variant={accordionOpen || activeExtraCount > 0 ? 'secondary' : 'outline'}
            size="sm"
            className="h-9 gap-1.5 shrink-0 relative"
            onClick={() => setAccordionOpen((o) => !o)}
          >
            <SlidersHorizontal className="size-3.5" />
            Mais filtros
            {/* Badge com contagem de filtros extras ativos */}
            {activeExtraCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                {activeExtraCount}
              </span>
            )}
            <ChevronDown className={cn('size-3.5 transition-transform duration-200', accordionOpen && 'rotate-180')} />
          </Button>
        )}

        {/* Botão limpar todos os filtros */}
        {totalActiveCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 gap-1.5 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={handleClearAll}
          >
            <X className="size-3.5" />
            Limpar filtros
          </Button>
        )}

        {/* Divisor + actions */}
        {actions && (
          <>
            <div className="h-5 w-px bg-border mx-1 shrink-0" />
            <div className="flex items-center gap-2 shrink-0">{actions}</div>
          </>
        )}
      </div>

      {/* Acordeão de filtros extras */}
      {hasExtra && (
        <div
          className={cn(
            'overflow-hidden transition-all duration-300 ease-in-out',
            accordionOpen ? 'max-h-96' : 'max-h-0',
          )}
        >
          <div className="flex flex-wrap items-center gap-2 border-t px-3 py-2.5 bg-muted/30">
            {extraFields.map(renderField)}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFilterValues(fields: FilterField[]) {
  const parsers = fields.reduce(
    (acc, field) => {
      let parser = field.parser;
      if (!parser) {
        switch (field.type) {
          case 'text':
          case 'select':
            parser = parseAsString.withDefault('');
            break;
          case 'date':
            parser = parseAsIsoDateTime;
            break;
          case 'dateRange':
            parser = parseAsString;
            break;
          default:
            parser = parseAsString.withDefault('');
        }
      }
      acc[field.key] = parser;
      return acc;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    {} as Record<string, any>,
  );

  const [filters] = useQueryStates(parsers, { shallow: false });

  const values = { ...filters };
  fields.forEach((field) => {
    if (field.type === 'dateRange' && typeof values[field.key] === 'string') {
      try {
        values[field.key] = JSON.parse(values[field.key]);
      } catch {
        values[field.key] = null;
      }
    }
  });

  return values;
}
