'use client';

import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { EmptyListState } from '@/components/ui/empty-list-state';
import { PageSectionHeader } from '@/components/ui/page-section-header';
import type {
  InventoryLowStockItemDTO,
  InventoryVariationOption,
} from '../data/types';

type LowStockListProps = {
  items: InventoryLowStockItemDTO[];
  variationOptions: InventoryVariationOption[];
  forbidden?: boolean;
};

export function LowStockList({
  items,
  variationOptions,
  forbidden = false,
}: LowStockListProps) {
  const optionById = useMemo(
    () => new Map(variationOptions.map((option) => [option.value, option])),
    [variationOptions],
  );

  const columns = useMemo<ColumnDef<InventoryLowStockItemDTO>[]>(
    () => [
      {
        id: 'variation',
        header: 'Variacao',
        cell: ({ row }) => optionById.get(row.original.variacaoId)?.label ?? row.original.variacaoId,
      },
      {
        accessorKey: 'saldoAtual',
        header: 'Saldo atual',
      },
      {
        accessorKey: 'estoqueMinimo',
        header: 'Minimo',
      },
      {
        id: 'status',
        header: 'Status',
        cell: () => (
          <Badge variant="secondary">
            <AlertTriangle className="mr-1 size-3.5" />
            Abaixo do minimo
          </Badge>
        ),
      },
    ],
    [optionById],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageSectionHeader
        title="Abaixo do minimo"
        subtitle="Monitore rapidamente as variacoes com necessidade de reposicao."
      />

      <Card className="p-0">
        {forbidden ? (
          <div className="p-8">
            <EmptyListState
              title="Acesso restrito"
              subtitle="Somente perfis ADMIN podem consultar esta lista."
            />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={items}
            empty={
              <EmptyListState
                title="Nenhum item abaixo do minimo"
                subtitle="Todas as variacoes consultadas estao com saldo dentro do esperado."
              />
            }
          />
        )}
      </Card>
    </div>
  );
}
