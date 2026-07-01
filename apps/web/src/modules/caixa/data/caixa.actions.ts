'use server';

import { revalidatePath } from 'next/cache';
import { mutate, type ActionResult } from '@/modules/catalog/data/action-result';
import type { FecharCaixaResultDTO, MovimentacaoDTO, SessaoOutDTO } from './types';

type AbrirCaixaInput = {
  /** Reais (number), `>= 0`. `operadorId` is derived server-side from the token. */
  valorAbertura: number;
};

type MovimentacaoInput = {
  /** Reais (number), `> 0`. */
  valor: number;
  observacao: string;
};

type FecharCaixaInput = {
  /** Reais (number), `>= 0`. */
  valorFechamento: number;
};

function revalidateCaixa(): void {
  revalidatePath('/caixa');
}

export async function abrirCaixa(
  input: AbrirCaixaInput,
): Promise<ActionResult<SessaoOutDTO>> {
  const result = await mutate<SessaoOutDTO>('/api/caixa/abrir', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (result.ok) revalidateCaixa();
  return result;
}

export async function registrarSangria(
  sessaoId: string,
  input: MovimentacaoInput,
): Promise<ActionResult<MovimentacaoDTO>> {
  const result = await mutate<MovimentacaoDTO>(`/api/caixa/${sessaoId}/sangria`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (result.ok) revalidateCaixa();
  return result;
}

export async function registrarSuprimento(
  sessaoId: string,
  input: MovimentacaoInput,
): Promise<ActionResult<MovimentacaoDTO>> {
  const result = await mutate<MovimentacaoDTO>(`/api/caixa/${sessaoId}/suprimento`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (result.ok) revalidateCaixa();
  return result;
}

export async function fecharCaixa(
  sessaoId: string,
  input: FecharCaixaInput,
): Promise<ActionResult<FecharCaixaResultDTO>> {
  const result = await mutate<FecharCaixaResultDTO>(`/api/caixa/${sessaoId}/fechar`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (result.ok) revalidateCaixa();
  return result;
}
