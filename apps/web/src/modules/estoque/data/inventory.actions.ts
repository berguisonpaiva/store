'use server';

import { revalidatePath } from 'next/cache';
import { mutate, type ActionResult } from '@/modules/catalog/data/action-result';
import type { InventoryOperationResultDTO } from './types';

type RegisterEntryInput = {
  variacaoId: string;
  quantidade: number;
  motivo: 'COMPRA' | 'DEVOLUCAO' | 'AJUSTE';
};

type RegisterExitInput = {
  variacaoId: string;
  quantidade: number;
  motivo: 'PERDA' | 'AJUSTE';
};

type AdjustBalanceInput = {
  variacaoId: string;
  novoSaldo: number;
  observacao: string;
};

function revalidateInventory(): void {
  revalidatePath('/inventory/movimentacoes');
  revalidatePath('/dashboard');
}

export async function registerEntry(
  input: RegisterEntryInput,
): Promise<ActionResult<InventoryOperationResultDTO>> {
  const result = await mutate<InventoryOperationResultDTO>('/api/inventory/entries', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (result.ok) revalidateInventory();
  return result;
}

export async function registerExit(
  input: RegisterExitInput,
): Promise<ActionResult<InventoryOperationResultDTO>> {
  const result = await mutate<InventoryOperationResultDTO>('/api/inventory/exits', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (result.ok) revalidateInventory();
  return result;
}

export async function adjustBalance(
  input: AdjustBalanceInput,
): Promise<ActionResult<InventoryOperationResultDTO>> {
  const result = await mutate<InventoryOperationResultDTO>('/api/inventory/adjustments', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (result.ok) revalidateInventory();
  return result;
}
