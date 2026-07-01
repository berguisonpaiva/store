'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Ban } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PageSectionHeader } from '@/components/ui/page-section-header';
import type { ActionResult } from '@/modules/catalog/data/action-result';
import {
  adicionarItem,
  aplicarDesconto,
  cancelarVenda,
  finalizarVenda,
  removerItem,
} from '../data/vendas.actions';
import {
  INSUFFICIENT_STOCK,
  messageForCode,
  resolveSaleErrorState,
} from '../data/error-messages';
import { isSaleReadOnly } from '../data/sale-view';
import type {
  AddItemInput,
  DescontoInput,
  FinalizarInput,
  VariationOption,
  VendaItemDTO,
  VendaOutDTO,
} from '../data/types';
import { DescontoControl } from './desconto-control';
import { ItemEntryField } from './item-entry-field';
import { ItensList } from './itens-list';
import { PagamentoStep } from './pagamento-step';
import { TotalsSummary } from './totals-summary';

type SaleScreenProps = {
  initialVenda: VendaOutDTO;
  variationOptions: VariationOption[];
};

const STATUS_LABEL: Record<string, string> = {
  ABERTA: 'Venda aberta',
  CONCLUIDA: 'Venda concluída',
  CANCELADA: 'Venda cancelada',
};

/**
 * PDV operation screen orchestrator. Holds the live `venda` in client state so
 * items/discount/payments update without a page reload, and maps API error
 * codes to UI behavior (highlight item, block, read-only) via
 * `resolveSaleErrorState`.
 */
export function SaleScreen({ initialVenda, variationOptions }: SaleScreenProps) {
  const router = useRouter();
  const [venda, setVenda] = useState<VendaOutDTO>(initialVenda);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const readOnly = isSaleReadOnly(venda);

  /** Apply an ActionResult to local state, surfacing errors per the mapping. */
  function handleResult(
    result: ActionResult<VendaOutDTO>,
    offendingVariacaoId?: string,
  ): boolean {
    if (result.ok) {
      setVenda(result.data);
      setHighlight(null);
      return true;
    }
    const state = resolveSaleErrorState(result.code);
    if (state === 'highlight-item' && offendingVariacaoId) {
      setHighlight(offendingVariacaoId);
    }
    if (state === 'read-only') {
      // The backend says the sale is already finalized: reflect it locally.
      setVenda((prev) => ({ ...prev, status: 'CONCLUIDA' }));
    }
    if (state === 'blocked') {
      router.refresh();
    }
    toast.error(messageForCode(result.code));
    return false;
  }

  async function onAdd(input: AddItemInput) {
    const result = await adicionarItem(venda.id, input);
    if (handleResult(result, input.variacaoId)) {
      toast.success('Item adicionado.');
    } else if (result.ok === false && result.code === INSUFFICIENT_STOCK) {
      // already highlighted by handleResult when a variacaoId was known
    }
  }

  async function onChangeQuantidade(item: VendaItemDTO, quantidade: number) {
    // Re-add reflects the new quantity through the backend total recompute by
    // removing then adding; the backend recomputes the snapshot/line totals.
    const removed = await removerItem(venda.id, item.id);
    if (!handleResult(removed)) return;
    const result = await adicionarItem(venda.id, {
      variacaoId: item.variacaoId,
      quantidade,
    });
    handleResult(result, item.variacaoId);
  }

  async function onRemove(item: VendaItemDTO) {
    const result = await removerItem(venda.id, item.id);
    if (handleResult(result)) toast.success('Item removido.');
  }

  async function onApplyDesconto(input: DescontoInput) {
    const result = await aplicarDesconto(venda.id, input);
    if (handleResult(result)) toast.success('Desconto aplicado.');
  }

  async function onFinalize(input: FinalizarInput) {
    const result = await finalizarVenda(venda.id, input);
    if (handleResult(result)) {
      toast.success('Venda finalizada com sucesso.');
      router.refresh();
    }
  }

  async function onCancel() {
    const result = await cancelarVenda(venda.id);
    setConfirmCancel(false);
    if (result.ok) {
      setVenda(result.data);
      toast.success('Venda cancelada.');
      router.refresh();
      return;
    }
    toast.error(messageForCode(result.code));
  }

  return (
    <div className="flex flex-col gap-6">
      <PageSectionHeader
        badge={
          <Badge variant={readOnly ? 'secondary' : 'default'}>
            {STATUS_LABEL[venda.status] ?? venda.status}
          </Badge>
        }
        title={`Venda #${venda.numero}`}
        subtitle="Bipe os produtos, confira os totais e finalize o pagamento."
        aside={
          venda.status === 'ABERTA' ? (
            <Button variant="outline" onClick={() => setConfirmCancel(true)}>
              <Ban className="size-4" />
              Cancelar venda
            </Button>
          ) : null
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Itens</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {readOnly ? null : (
                <ItemEntryField options={variationOptions} onAdd={onAdd} />
              )}
              <ItensList
                itens={venda.itens}
                options={variationOptions}
                readOnly={readOnly}
                highlightVariacaoId={highlight}
                onChangeQuantidade={onChangeQuantidade}
                onRemove={onRemove}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <TotalsSummary
                subtotal={venda.subtotal}
                desconto={venda.desconto}
                total={venda.total}
              />
              {readOnly ? null : (
                <DescontoControl
                  subtotal={venda.subtotal}
                  onApply={onApplyDesconto}
                />
              )}
            </CardContent>
          </Card>

          {readOnly ? null : (
            <Card>
              <CardHeader>
                <CardTitle>Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <PagamentoStep total={venda.total} onFinalize={onFinalize} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancelar venda"
        description="Tem certeza de que deseja cancelar esta venda? Os itens não serão registrados."
        confirmLabel="Cancelar venda"
        onConfirm={onCancel}
      />
    </div>
  );
}
