'use client';

import { useState } from 'react';
import { parseAsString, useQueryState } from 'nuqs';
import { Card } from '@/components/ui/card';
import { EmptyListState } from '@/components/ui/empty-list-state';
import { PageSectionHeader } from '@/components/ui/page-section-header';
import { ReadonlyTextField } from '@/components/ui/readonly-text-field';
import type { InventoryBalanceDTO, InventoryVariationOption } from '../data/types';
import { VariationLookupField } from './variation-lookup-field';

type InventoryBalanceViewProps = {
  variationOptions: InventoryVariationOption[];
  selectedVariationId?: string;
  balance?: InventoryBalanceDTO | null;
  variationMissing?: boolean;
  /** When rendered inside a dialog: hide the page header and resolve the balance
   * locally from `balancesByVariationId` instead of relying on the URL/server. */
  embedded?: boolean;
  balancesByVariationId?: Record<string, InventoryBalanceDTO | undefined>;
};

export function InventoryBalanceView({
  variationOptions,
  selectedVariationId,
  balance,
  variationMissing = false,
  embedded = false,
  balancesByVariationId,
}: InventoryBalanceViewProps) {
  const [urlVariationId, setUrlVariationId] = useQueryState(
    'variationId',
    parseAsString.withDefault('').withOptions({ shallow: false }),
  );
  const [localVariationId, setLocalVariationId] = useState('');

  const variationId = embedded ? localVariationId : urlVariationId;
  const setVariationId = embedded ? setLocalVariationId : setUrlVariationId;

  const resolvedBalance = embedded
    ? (variationId ? balancesByVariationId?.[variationId] ?? null : null)
    : balance ?? null;

  const selected = variationId || (embedded ? '' : selectedVariationId);

  return (
    <div className="flex flex-col gap-6">
      {embedded ? null : (
        <PageSectionHeader
          title="Consultar saldo"
          subtitle="Selecione uma variacao para visualizar o saldo atual e o estoque minimo."
        />
      )}

      <Card className="p-6">
        <VariationLookupField
          value={selected}
          onChange={(value) => void setVariationId(value)}
          options={variationOptions}
        />
      </Card>

      {!selected ? (
        <Card className="p-8">
          <EmptyListState
            title="Selecione uma variacao"
            subtitle="Use o combobox acima para localizar o item que deseja consultar."
          />
        </Card>
      ) : variationMissing ? (
        <Card className="p-8">
          <EmptyListState
            title="Variacao nao encontrada"
            subtitle="A variacao selecionada nao existe mais ou nao esta acessivel para sua sessao."
          />
        </Card>
      ) : resolvedBalance ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-5">
            <p className="mb-2 text-sm text-muted-foreground">Saldo atual</p>
            <ReadonlyTextField value={resolvedBalance.saldoAtual} />
          </Card>
          <Card className="p-5">
            <p className="mb-2 text-sm text-muted-foreground">Estoque minimo</p>
            <ReadonlyTextField value={resolvedBalance.estoqueMinimo} />
          </Card>
        </div>
      ) : null}
    </div>
  );
}
