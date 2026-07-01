'use server';

import { revalidatePath } from 'next/cache';
import { mutate, type ActionResult } from '@/modules/catalog/data/action-result';
import type {
  AddItemInput,
  DescontoInput,
  FinalizarInput,
  VendaOutDTO,
} from './types';

function revalidateVendas(): void {
  revalidatePath('/vendas');
}

/** Open a new sale. The operator + open session are derived server-side. */
export async function abrirVenda(): Promise<ActionResult<VendaOutDTO>> {
  const result = await mutate<VendaOutDTO>('/api/vendas', {
    method: 'POST',
    body: JSON.stringify({}),
  });
  if (result.ok) revalidateVendas();
  return result;
}

/**
 * Add an item by `variacaoId` | `sku` | `codigoBarras` (bip). `quantidade` is an
 * integer. Returns the updated sale.
 */
export async function adicionarItem(
  vendaId: string,
  input: AddItemInput,
): Promise<ActionResult<VendaOutDTO>> {
  const result = await mutate<VendaOutDTO>(`/api/vendas/${vendaId}/itens`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (result.ok) revalidateVendas();
  return result;
}

export async function removerItem(
  vendaId: string,
  itemId: string,
): Promise<ActionResult<VendaOutDTO>> {
  const result = await mutate<VendaOutDTO>(`/api/vendas/${vendaId}/itens/${itemId}`, {
    method: 'DELETE',
  });
  if (result.ok) revalidateVendas();
  return result;
}

/**
 * Apply a discount. The wire is reais: `valor` is sent as reais for
 * `tipo: 'valor'` and as a raw 0..100 percentage for `tipo: 'percentual'`.
 */
export async function aplicarDesconto(
  vendaId: string,
  input: DescontoInput,
): Promise<ActionResult<VendaOutDTO>> {
  const result = await mutate<VendaOutDTO>(`/api/vendas/${vendaId}/desconto`, {
    method: 'PATCH',
    body: JSON.stringify({ tipo: input.tipo, valor: input.valor }),
  });
  if (result.ok) revalidateVendas();
  return result;
}

/** Finalize. Payment values are in reais and sent to the backend as-is. */
export async function finalizarVenda(
  vendaId: string,
  input: FinalizarInput,
): Promise<ActionResult<VendaOutDTO>> {
  const result = await mutate<VendaOutDTO>(`/api/vendas/${vendaId}/finalizar`, {
    method: 'POST',
    body: JSON.stringify({ pagamentos: input.pagamentos }),
  });
  if (result.ok) revalidateVendas();
  return result;
}

export async function cancelarVenda(
  vendaId: string,
): Promise<ActionResult<VendaOutDTO>> {
  const result = await mutate<VendaOutDTO>(`/api/vendas/${vendaId}/cancelar`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  if (result.ok) revalidateVendas();
  return result;
}
