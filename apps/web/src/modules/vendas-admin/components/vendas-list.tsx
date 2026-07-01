'use client';

import { useMemo } from 'react';
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from 'nuqs';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { DataTable } from '@/components/ui/data-table';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { EmptyListState } from '@/components/ui/empty-list-state';
import { Label } from '@/components/ui/label';
import { PageSectionHeader } from '@/components/ui/page-section-header';
import { PaginationControls } from '@/components/ui/pagination-controls';
import {
  formatBRL,
  formatDateTime,
  itemCount,
  saleNumberLabel,
  saleStatusLabel,
} from '../data/format';
import { VENDA_STATUS_VALUES } from '../schemas/vendas-filter.schema';
import type {
  OperatorOption,
  PaginationMetaDTO,
  VendaOutDTO,
  VendaStatus,
} from '../data/types';

type VendasListProps = {
  vendas: VendaOutDTO[];
  meta: PaginationMetaDTO;
  operators: OperatorOption[];
};

const STATUS_FILTER_OPTIONS = [
  { label: 'Todos os status', value: 'all' },
  { label: 'Aberta', value: 'ABERTA' },
  { label: 'Concluída', value: 'CONCLUIDA' },
  { label: 'Cancelada', value: 'CANCELADA' },
];

function statusBadgeVariant(
  status: VendaStatus,
): 'default' | 'secondary' | 'outline' {
  if (status === 'CONCLUIDA') return 'default';
  if (status === 'CANCELADA') return 'outline';
  return 'secondary';
}

/** CANCELADA gets a muted destructive tint on top of the `outline` variant. */
function statusBadgeClassName(status: VendaStatus): string | undefined {
  return status === 'CANCELADA'
    ? 'border-destructive/40 text-destructive'
    : undefined;
}

export function VendasList({ vendas, meta, operators }: VendasListProps) {
  const [usuarioId, setUsuarioId] = useQueryState(
    'usuarioId',
    parseAsString.withOptions({ shallow: false }),
  );
  const [status, setStatus] = useQueryState(
    'status',
    parseAsStringLiteral(VENDA_STATUS_VALUES).withOptions({ shallow: false }),
  );
  const [startDate, setStartDate] = useQueryState(
    'startDate',
    parseAsString.withOptions({ shallow: false }),
  );
  const [endDate, setEndDate] = useQueryState(
    'endDate',
    parseAsString.withOptions({ shallow: false }),
  );
  const [, setPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(1).withOptions({ shallow: false }),
  );

  const operatorName = useMemo(() => {
    const byId = new Map(operators.map((op) => [op.id, op.name]));
    return (id: string) => byId.get(id) ?? id;
  }, [operators]);

  const operatorFilterOptions = useMemo(
    () => [
      { label: 'Todos os operadores', value: 'all' },
      ...operators.map((op) => ({ label: op.name, value: op.id })),
    ],
    [operators],
  );

  const columns = useMemo<ColumnDef<VendaOutDTO>[]>(
    () => [
      {
        accessorKey: 'numero',
        header: 'Número',
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">
            {saleNumberLabel(row.original.numero)}
          </span>
        ),
      },
      {
        accessorKey: 'usuarioId',
        header: 'Operador',
        cell: ({ row }) => (
          <span className="font-medium">
            {operatorName(row.original.usuarioId)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge
            variant={statusBadgeVariant(row.original.status)}
            className={statusBadgeClassName(row.original.status)}
          >
            {saleStatusLabel(row.original.status)}
          </Badge>
        ),
      },
      {
        id: 'itens',
        header: 'Itens',
        meta: { headClassName: 'text-right', cellClassName: 'text-right' },
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {itemCount(row.original.itens)}
          </span>
        ),
      },
      {
        accessorKey: 'total',
        header: 'Total',
        meta: { headClassName: 'text-right', cellClassName: 'text-right' },
        cell: ({ row }) => (
          <span className="tabular-nums">{formatBRL(row.original.total)}</span>
        ),
      },
      {
        id: 'data',
        header: 'Data',
        meta: { headClassName: 'text-right', cellClassName: 'text-right' },
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {formatDateTime(row.original.concluidaEm ?? row.original.criadoEm)}
          </span>
        ),
      },
    ],
    [operatorName],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageSectionHeader
        title="Vendas"
        subtitle="Consulte as vendas de todos os operadores (somente leitura)."
      />

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <Label>Operador</Label>
            <Combobox
              options={operatorFilterOptions}
              value={usuarioId ?? 'all'}
              onChange={(value) => {
                void setUsuarioId(value === 'all' ? null : value);
                void setPage(1);
              }}
              placeholder="Operador"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Status</Label>
            <Combobox
              options={STATUS_FILTER_OPTIONS}
              value={status ?? 'all'}
              onChange={(value) => {
                void setStatus(value === 'all' ? null : (value as VendaStatus));
                void setPage(1);
              }}
              placeholder="Status"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>A partir de</Label>
            <DatePickerInput
              value={startDate ?? undefined}
              onChange={(value) => {
                void setStartDate(value || null);
                void setPage(1);
              }}
              placeholder="Data inicial"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Até</Label>
            <DatePickerInput
              value={endDate ?? undefined}
              onChange={(value) => {
                void setEndDate(value || null);
                void setPage(1);
              }}
              placeholder="Data final"
            />
          </div>
        </div>
      </Card>

      <Card className="p-0">
        <DataTable
          columns={columns}
          data={vendas}
          empty={
            <EmptyListState
              title="Nenhuma venda encontrada"
              subtitle="Ajuste os filtros de operador, período ou status."
            />
          }
        />
      </Card>

      <PaginationControls
        page={meta.page}
        totalPages={meta.totalPages}
        totalItems={meta.total}
        totalLabel="vendas"
        onPageChange={(next) => void setPage(next)}
      />
    </div>
  );
}
