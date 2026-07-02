import { randomUUID } from 'node:crypto';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { PrismaService } from '../../src/db/prisma.service';
import { resetTestState as resetPrismaTestState } from '../../src/testing/reset-test-state';
import { type AuthSession, withAuth } from './auth';
import request from 'supertest';

type AuthLike = string | Pick<AuthSession, 'accessToken'>;

export function useIsolatedTestApp(
  appPromise: Promise<NestFastifyApplication>,
): void {
  beforeEach(async () => {
    const app = await appPromise;
    await resetTestState(app);
  });
}

export async function resetTestState(
  app: NestFastifyApplication,
): Promise<void> {
  const prisma = app.get(PrismaService).client;
  await resetPrismaTestState(prisma);
}

export async function criarCategoria(
  app: NestFastifyApplication,
  auth: AuthLike,
  overrides: Partial<{
    name: string;
    active: boolean;
  }> = {},
): Promise<any> {
  const response = await withAuth(
    request(app.getHttpServer()).post('/api/categories'),
    auth,
  )
    .send({
      name: overrides.name ?? `Categoria ${randomUUID()}`,
      active: overrides.active ?? true,
    })
    .expect(201);

  return response.body;
}

export async function criarProdutoComVariacao(
  app: NestFastifyApplication,
  auth: AuthLike,
  overrides: Partial<{
    categoryId: string | null;
    name: string;
    description: string | null;
    active: boolean;
    sku: string;
    barcode: string | null;
    price: number;
    minStock: number;
  }> = {},
): Promise<any> {
  const response = await withAuth(
    request(app.getHttpServer()).post('/api/products'),
    auth,
  )
    .send({
      name: overrides.name ?? `Produto ${randomUUID()}`,
      description: overrides.description ?? null,
      categoryId: overrides.categoryId,
      active: overrides.active ?? true,
      variations: [
        {
          sku: overrides.sku ?? `SKU-${randomUUID()}`,
          barcode: overrides.barcode ?? null,
          attributes: { tamanho: 'padrao' },
          price: overrides.price ?? 1500,
          minStock: overrides.minStock ?? 0,
          active: true,
        },
      ],
    })
    .expect(201);

  return response.body;
}

export async function darEntradaEstoque(
  app: NestFastifyApplication,
  auth: AuthLike,
  input: {
    variacaoId: string;
    quantidade?: number;
    motivo?: 'COMPRA' | 'DEVOLUCAO' | 'AJUSTE';
  },
): Promise<any> {
  const response = await withAuth(
    request(app.getHttpServer()).post('/api/inventory/entries'),
    auth,
  )
    .send({
      variacaoId: input.variacaoId,
      quantidade: input.quantidade ?? 10,
      motivo: input.motivo ?? 'COMPRA',
    })
    .expect(201);

  return response.body;
}

export async function abrirCaixa(
  app: NestFastifyApplication,
  auth: AuthLike,
  overrides: Partial<{
    valorAbertura: number;
  }> = {},
): Promise<any> {
  const response = await withAuth(
    request(app.getHttpServer()).post('/api/caixa/abrir'),
    auth,
  )
    .send({
      valorAbertura: overrides.valorAbertura ?? 100,
    })
    .expect(201);

  return response.body;
}

export async function criarVendaComItem(
  app: NestFastifyApplication,
  auth: AuthLike,
  input: {
    variacaoId: string;
    quantidade?: number;
  },
): Promise<any> {
  const sale = await withAuth(request(app.getHttpServer()).post('/api/vendas'), auth)
    .send({})
    .expect(201);

  const updatedSale = await withAuth(
    request(app.getHttpServer()).post(`/api/vendas/${sale.body.id}/itens`),
    auth,
  )
    .send({
      variacaoId: input.variacaoId,
      quantidade: input.quantidade ?? 1,
    })
    .expect(201);

  return updatedSale.body;
}
