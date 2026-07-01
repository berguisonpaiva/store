'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs';
import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  Scale,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DataTable } from '@/components/ui/data-table';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { EmptyListState } from '@/components/ui/empty-list-state';
import { PageSectionHeader } from '@/components/ui/page-section-header';
import { PaginationControls } from '@/components/ui/pagination-controls';
import type {
  InventoryBalanceDTO,
  InventoryMovementDTO,
  InventoryVariationOption,
} from '../data/types';
import type { PaginationMetaDTO } from '@/modules/catalog/data/types';
import { VariationLookupField } from './variation-lookup-field';
import { InventoryBalanceView } from './inventory-balance-view';
import { InventoryEntryForm } from './inventory-entry-form';
import { InventoryExitForm } from './inventory-exit-form';
import { InventoryAdjustmentForm } from './inventory-adjustment-form';

type InventoryActionDialog = 'balance' | 'entry' | 'exit' | 'adjustment';

type InventoryMovementsListProps = {
  variationOptions: InventoryVariationOption[];
  selectedVariationId?: string;
  selectedFrom?: string;
  selectedTo?: string;
  movements: InventoryMovementDTO[];
  meta: PaginationMetaDTO;
  variationMissing?: boolean;
  /** Precomputed balances per variation, used by the Saldo and Saída dialogs. */
  balancesByVariationId: Record<string, InventoryBalanceDTO | undefined>;
  /** Whether the session may register adjustments (ADMIN). */
  canAdjust?: boolean;
};

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return format(date, "dd/MM/yyyy 'as' HH:mm", { locale: ptBR });
}

export function InventoryMovementsList({
  variationOptions,
  selectedVariationId,
  selectedFrom = '',
  selectedTo = '',
  movements,
  meta,
  variationMissing = false,
  balancesByVariationId,
  canAdjust = false,
}: InventoryMovementsListProps) {
  const [openDialog, setOpenDialog] = useState<InventoryActionDialog | null>(null);
  const closeDialog = () => setOpenDialog(null);
  const [variationId, setVariationId] = useQueryState(
    'variationId',
    parseAsString.withDefault('').withOptions({ shallow: false }),
  );
  const [from, setFrom] = useQueryState(
    'from',
    parseAsString.withDefault('').withOptions({ shallow: false }),
  );
  const [to, setTo] = useQueryState(
    'to',
    parseAsString.withDefault('').withOptions({ shallow: false }),
  );
  const [, setPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(1).withOptions({ shallow: false }),
  );

  const columns = useMemo<ColumnDef<InventoryMovementDTO>[]>(
    () => [
      {
        accessorKey: 'timestamp',
        header: 'Quando',
        cell: ({ row }) => formatTimestamp(row.original.timestamp),
      },
      {
        accessorKey: 'tipo',
        header: 'Tipo',
        cell: ({ row }) => (
          <Badge variant={row.original.tipo === 'SAIDA' ? 'secondary' : 'default'}>
            {row.original.tipo}
          </Badge>
        ),
      },
      {
        accessorKey: 'motivo',
        header: 'Motivo',
      },
      {
        accessorKey: 'quantidade',
        header: 'Quantidade',
      },
      {
        accessorKey: 'saldoResultante',
        header: 'Saldo resultante',
      },
      {
        accessorKey: 'origemVendaId',
        header: 'Origem venda',
        cell: ({ row }) => row.original.origemVendaId ?? '—',
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageSectionHeader
        title="Movimentacoes"
        subtitle="Filtre por variacao e periodo para acompanhar o historico do ledger."
        aside={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setOpenDialog('balance')}>
              <Boxes className="size-4" />
              Saldo
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpenDialog('entry')}>
              <ArrowDownToLine className="size-4" />
              Entrada
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpenDialog('exit')}>
              <ArrowUpFromLine className="size-4" />
              Saida
            </Button>
            {canAdjust ? (
              <Button type="button" onClick={() => setOpenDialog('adjustment')}>
                <Scale className="size-4" />
                Ajuste
              </Button>
            ) : null}
          </div>
        }
      />

      <Dialog
        open={openDialog === 'balance'}
        onOpenChange={(open) => (open ? setOpenDialog('balance') : closeDialog())}
      >
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Consultar saldo</DialogTitle>
            <DialogDescription>
              Selecione uma variacao para visualizar saldo atual, reservado e disponivel.
            </DialogDescription>
          </DialogHeader>
          <InventoryBalanceView
            embedded
            variationOptions={variationOptions}
            balancesByVariationId={balancesByVariationId}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={openDialog === 'entry'}
        onOpenChange={(open) => (open ? setOpenDialog('entry') : closeDialog())}
      >
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Entrada de estoque</DialogTitle>
            <DialogDescription>
              Registre compras, devolucoes e reforcos de saldo para uma variacao.
            </DialogDescription>
          </DialogHeader>
          <InventoryEntryForm
            embedded
            variationOptions={variationOptions}
            onCancel={closeDialog}
            onSuccess={closeDialog}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={openDialog === 'exit'}
        onOpenChange={(open) => (open ? setOpenDialog('exit') : closeDialog())}
      >
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Saida manual</DialogTitle>
            <DialogDescription>
              Lancamento de perdas ou baixas manuais com validacao de saldo atual.
            </DialogDescription>
          </DialogHeader>
          <InventoryExitForm
            embedded
            variationOptions={variationOptions}
            balancesByVariationId={balancesByVariationId}
            onCancel={closeDialog}
            onSuccess={closeDialog}
          />
        </DialogContent>
      </Dialog>

      {canAdjust ? (
        <Dialog
          open={openDialog === 'adjustment'}
          onOpenChange={(open) => (open ? setOpenDialog('adjustment') : closeDialog())}
        >
          <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ajuste de saldo</DialogTitle>
              <DialogDescription>
                Corrija o saldo absoluto de uma variacao com justificativa obrigatoria.
              </DialogDescription>
            </DialogHeader>
            <InventoryAdjustmentForm
              embedded
              variationOptions={variationOptions}
              onCancel={closeDialog}
              onSuccess={closeDialog}
            />
          </DialogContent>
        </Dialog>
      ) : null}

      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <VariationLookupField
            value={variationId || selectedVariationId}
            onChange={(value) => {
              void setVariationId(value);
              void setPage(1);
            }}
            options={variationOptions}
          />
          <div className="space-y-2">
            <label className="text-sm font-medium">De</label>
            <DatePickerInput
              value={from || selectedFrom}
              onChange={(value) => {
                void setFrom(value);
                void setPage(1);
              }}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Ate</label>
            <DatePickerInput
              value={to || selectedTo}
              onChange={(value) => {
                void setTo(value);
                void setPage(1);
              }}
            />
          </div>
        </div>
      </Card>

      {!variationId && !selectedVariationId ? (
        <Card className="p-8">
          <EmptyListState
            title="Selecione uma variacao"
            subtitle="A consulta de movimentacoes depende da variacao escolhida."
          />
        </Card>
      ) : variationMissing ? (
        <Card className="p-8">
          <EmptyListState
            title="Variacao nao encontrada"
            subtitle="A variacao informada nao existe mais ou nao esta disponivel."
          />
        </Card>
      ) : (
        <>
          <Card className="p-0">
            <DataTable
              columns={columns}
              data={movements}
              empty={
                <EmptyListState
                  title="Nenhuma movimentacao encontrada"
                  subtitle="Ajuste o periodo ou selecione outra variacao."
                />
              }
            />
          </Card>

          <PaginationControls
            page={meta.page}
            totalPages={meta.totalPages}
            totalItems={meta.total}
            totalLabel="movimentacoes"
            onPageChange={(next) => void setPage(next)}
          />
        </>
      )}
    </div>
  );
}
