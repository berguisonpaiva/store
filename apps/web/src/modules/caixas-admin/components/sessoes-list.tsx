'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from 'nuqs';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { DataTable } from '@/components/ui/data-table';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { EmptyListState } from '@/components/ui/empty-list-state';
import { Label } from '@/components/ui/label';
import { PageSectionHeader } from '@/components/ui/page-section-header';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { formatBRL, formatDateTime, sessionStatusLabel } from '../data/format';
import { SESSAO_STATUS_VALUES } from '../schemas/caixas-filter.schema';
import type {
  OperatorOption,
  PaginationMetaDTO,
  SessaoOutDTO,
} from '../data/types';

type SessoesListProps = {
  sessoes: SessaoOutDTO[];
  meta: PaginationMetaDTO;
  operators: OperatorOption[];
};

const STATUS_FILTER_OPTIONS = [
  { label: 'Todos os status', value: 'all' },
  { label: 'Aberta', value: 'ABERTA' },
  { label: 'Fechada', value: 'FECHADA' },
];

export function SessoesList({ sessoes, meta, operators }: SessoesListProps) {
  const [usuarioId, setUsuarioId] = useQueryState(
    'usuarioId',
    parseAsString.withOptions({ shallow: false }),
  );
  const [status, setStatus] = useQueryState(
    'status',
    parseAsStringLiteral(SESSAO_STATUS_VALUES).withOptions({ shallow: false }),
  );
  const [from, setFrom] = useQueryState(
    'from',
    parseAsString.withOptions({ shallow: false }),
  );
  const [to, setTo] = useQueryState(
    'to',
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

  const columns = useMemo<ColumnDef<SessaoOutDTO>[]>(
    () => [
      {
        accessorKey: 'operadorId',
        header: 'Operador',
        cell: ({ row }) => (
          <span className="font-medium">
            {operatorName(row.original.operadorId)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge
            variant={row.original.status === 'ABERTA' ? 'default' : 'secondary'}
          >
            {sessionStatusLabel(row.original.status)}
          </Badge>
        ),
      },
      {
        accessorKey: 'valorAbertura',
        header: 'Abertura',
        meta: { headClassName: 'text-right', cellClassName: 'text-right' },
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatBRL(row.original.valorAbertura)}
          </span>
        ),
      },
      {
        accessorKey: 'abertaEm',
        header: 'Aberta em',
        meta: { headClassName: 'text-right', cellClassName: 'text-right' },
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {formatDateTime(row.original.abertaEm)}
          </span>
        ),
      },
      {
        accessorKey: 'fechadaEm',
        header: 'Fechada em',
        meta: { headClassName: 'text-right', cellClassName: 'text-right' },
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {formatDateTime(row.original.fechadaEm)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Ações',
        enableSorting: false,
        meta: { headClassName: 'text-right', cellClassName: 'text-right' },
        cell: ({ row }) => (
          <div className="flex items-center justify-end">
            <Button
              asChild
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Ver detalhes da sessão"
              title="Ver detalhes"
            >
              <Link href={`/caixas/${row.original.id}`}>
                <Eye className="size-4" />
              </Link>
            </Button>
          </div>
        ),
      },
    ],
    [operatorName],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageSectionHeader
        title="Caixas"
        subtitle="Consulte as sessões de caixa de todos os operadores (somente leitura)."
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
                void setStatus(
                  value === 'all' ? null : (value as 'ABERTA' | 'FECHADA'),
                );
                void setPage(1);
              }}
              placeholder="Status"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Aberta a partir de</Label>
            <DatePickerInput
              value={from ?? undefined}
              onChange={(value) => {
                void setFrom(value || null);
                void setPage(1);
              }}
              placeholder="Data inicial"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Aberta até</Label>
            <DatePickerInput
              value={to ?? undefined}
              onChange={(value) => {
                void setTo(value || null);
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
          data={sessoes}
          empty={
            <EmptyListState
              title="Nenhuma sessão encontrada"
              subtitle="Ajuste os filtros de operador, período ou status."
            />
          }
        />
      </Card>

      <PaginationControls
        page={meta.page}
        totalPages={meta.totalPages}
        totalItems={meta.total}
        totalLabel="sessões"
        onPageChange={(next) => void setPage(next)}
      />
    </div>
  );
}
