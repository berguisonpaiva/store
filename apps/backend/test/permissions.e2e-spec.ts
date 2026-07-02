import request from 'supertest';
import { createTestApp } from './utils/create-test-app';
import { createOperador, loginAsAdmin, withAuth } from './utils/auth';
import { expectApiError } from './utils/assert-api-error';
import { abrirCaixa, useIsolatedTestApp } from './utils/factories';

const UNKNOWN_ID = '11111111-1111-1111-1111-111111111111';
const UNKNOWN_ITEM_ID = '22222222-2222-2222-2222-222222222222';

function expectAllowedStatus(status: number): void {
  expect(status).not.toBe(401);
  expect(status).not.toBe(403);
}

describe('permissions e2e', () => {
  const appPromise = createTestApp();
  useIsolatedTestApp(appPromise);

  afterAll(async () => {
    const app = await appPromise;
    await app.close();
  });

  it('rejects OPERADOR and anonymous on ADMIN-only endpoints', async () => {
    const app = await appPromise;
    const adminAuth = await loginAsAdmin(app);
    const operador = await createOperador(app, adminAuth);

    const adminOnlyRoutes = [
      {
        label: 'POST /api/users',
        operadorCall: () =>
          withAuth(request(app.getHttpServer()).post('/api/users'), operador.auth)
            .send({
              name: 'Operador Matrix',
              email: 'matrix@store.local',
              password: 'Operador!123',
              role: 'OPERADOR',
              active: true,
            }),
        anonymousCall: () =>
          request(app.getHttpServer()).post('/api/users').send({
            name: 'Operador Matrix',
            email: 'matrix@store.local',
            password: 'Operador!123',
            role: 'OPERADOR',
            active: true,
          }),
      },
      {
        label: 'PATCH /api/users/:id',
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).patch(`/api/users/${UNKNOWN_ID}`),
            operador.auth,
          ).send({ name: 'Alterado' }),
        anonymousCall: () =>
          request(app.getHttpServer())
            .patch(`/api/users/${UNKNOWN_ID}`)
            .send({ name: 'Alterado' }),
      },
      {
        label: 'PATCH /api/users/:id/activate',
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).patch(`/api/users/${UNKNOWN_ID}/activate`),
            operador.auth,
          ).send({}),
        anonymousCall: () =>
          request(app.getHttpServer()).patch(`/api/users/${UNKNOWN_ID}/activate`),
      },
      {
        label: 'PATCH /api/users/:id/deactivate',
        operadorCall: () =>
          withAuth(
            request(
              app.getHttpServer(),
            ).patch(`/api/users/${UNKNOWN_ID}/deactivate`),
            operador.auth,
          ).send({}),
        anonymousCall: () =>
          request(app.getHttpServer()).patch(`/api/users/${UNKNOWN_ID}/deactivate`),
      },
      {
        label: 'GET /api/users',
        operadorCall: () =>
          withAuth(request(app.getHttpServer()).get('/api/users'), operador.auth),
        anonymousCall: () => request(app.getHttpServer()).get('/api/users'),
      },
      {
        label: 'GET /api/users/:id',
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).get(`/api/users/${UNKNOWN_ID}`),
            operador.auth,
          ),
        anonymousCall: () =>
          request(app.getHttpServer()).get(`/api/users/${UNKNOWN_ID}`),
      },
      {
        label: 'POST /api/categories',
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).post('/api/categories'),
            operador.auth,
          ).send({ name: 'Categoria Matrix', active: true }),
        anonymousCall: () =>
          request(app.getHttpServer())
            .post('/api/categories')
            .send({ name: 'Categoria Matrix', active: true }),
      },
      {
        label: 'PATCH /api/categories/:id',
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).patch(`/api/categories/${UNKNOWN_ID}`),
            operador.auth,
          ).send({ name: 'Categoria Alterada' }),
        anonymousCall: () =>
          request(app.getHttpServer())
            .patch(`/api/categories/${UNKNOWN_ID}`)
            .send({ name: 'Categoria Alterada' }),
      },
      {
        label: 'PATCH /api/categories/:id/activate',
        operadorCall: () =>
          withAuth(
            request(
              app.getHttpServer(),
            ).patch(`/api/categories/${UNKNOWN_ID}/activate`),
            operador.auth,
          ),
        anonymousCall: () =>
          request(app.getHttpServer()).patch(
            `/api/categories/${UNKNOWN_ID}/activate`,
          ),
      },
      {
        label: 'PATCH /api/categories/:id/deactivate',
        operadorCall: () =>
          withAuth(
            request(
              app.getHttpServer(),
            ).patch(`/api/categories/${UNKNOWN_ID}/deactivate`),
            operador.auth,
          ),
        anonymousCall: () =>
          request(app.getHttpServer()).patch(
            `/api/categories/${UNKNOWN_ID}/deactivate`,
          ),
      },
      {
        label: 'GET /api/categories',
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).get('/api/categories'),
            operador.auth,
          ),
        anonymousCall: () => request(app.getHttpServer()).get('/api/categories'),
      },
      {
        label: 'POST /api/products',
        operadorCall: () =>
          withAuth(request(app.getHttpServer()).post('/api/products'), operador.auth)
            .send({
              name: 'Produto Matrix',
              description: 'Teste',
              categoryId: null,
              active: true,
              variations: [
                {
                  sku: 'SKU-MATRIX',
                  barcode: '789000000001',
                  attributes: { cor: 'azul' },
                  price: 19.9,
                  minStock: 0,
                  active: true,
                },
              ],
            }),
        anonymousCall: () =>
          request(app.getHttpServer()).post('/api/products').send({
            name: 'Produto Matrix',
            description: 'Teste',
            categoryId: null,
            active: true,
            variations: [
              {
                sku: 'SKU-MATRIX',
                barcode: '789000000001',
                attributes: { cor: 'azul' },
                price: 19.9,
                minStock: 0,
                active: true,
              },
            ],
          }),
      },
      {
        label: 'PATCH /api/products/:id',
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).patch(`/api/products/${UNKNOWN_ID}`),
            operador.auth,
          ).send({ name: 'Produto Alterado' }),
        anonymousCall: () =>
          request(app.getHttpServer())
            .patch(`/api/products/${UNKNOWN_ID}`)
            .send({ name: 'Produto Alterado' }),
      },
      {
        label: 'PATCH /api/products/:id/activate',
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).patch(`/api/products/${UNKNOWN_ID}/activate`),
            operador.auth,
          ),
        anonymousCall: () =>
          request(app.getHttpServer()).patch(`/api/products/${UNKNOWN_ID}/activate`),
      },
      {
        label: 'PATCH /api/products/:id/deactivate',
        operadorCall: () =>
          withAuth(
            request(
              app.getHttpServer(),
            ).patch(`/api/products/${UNKNOWN_ID}/deactivate`),
            operador.auth,
          ),
        anonymousCall: () =>
          request(app.getHttpServer()).patch(
            `/api/products/${UNKNOWN_ID}/deactivate`,
          ),
      },
      {
        label: 'GET /api/products',
        operadorCall: () =>
          withAuth(request(app.getHttpServer()).get('/api/products'), operador.auth),
        anonymousCall: () => request(app.getHttpServer()).get('/api/products'),
      },
      {
        label: 'GET /api/products/:id',
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).get(`/api/products/${UNKNOWN_ID}`),
            operador.auth,
          ),
        anonymousCall: () =>
          request(app.getHttpServer()).get(`/api/products/${UNKNOWN_ID}`),
      },
      {
        label: 'POST /api/products/:productId/variations',
        operadorCall: () =>
          withAuth(
            request(
              app.getHttpServer(),
            ).post(`/api/products/${UNKNOWN_ID}/variations`),
            operador.auth,
          ).send({
            sku: 'SKU-VARIACAO',
            barcode: '789000000002',
            attributes: { tamanho: 'M' },
            price: 9.9,
            minStock: 0,
            active: true,
          }),
        anonymousCall: () =>
          request(app.getHttpServer())
            .post(`/api/products/${UNKNOWN_ID}/variations`)
            .send({
              sku: 'SKU-VARIACAO',
              barcode: '789000000002',
              attributes: { tamanho: 'M' },
              price: 9.9,
              minStock: 0,
              active: true,
            }),
      },
      {
        label: 'PATCH /api/products/:productId/variations/:variationId',
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).patch(
              `/api/products/${UNKNOWN_ID}/variations/${UNKNOWN_ID}`,
            ),
            operador.auth,
          ).send({ sku: 'SKU-VARIACAO-2' }),
        anonymousCall: () =>
          request(app.getHttpServer())
            .patch(`/api/products/${UNKNOWN_ID}/variations/${UNKNOWN_ID}`)
            .send({ sku: 'SKU-VARIACAO-2' }),
      },
      {
        label: 'PATCH /api/products/:productId/variations/:variationId/activate',
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).patch(
              `/api/products/${UNKNOWN_ID}/variations/${UNKNOWN_ID}/activate`,
            ),
            operador.auth,
          ),
        anonymousCall: () =>
          request(app.getHttpServer()).patch(
            `/api/products/${UNKNOWN_ID}/variations/${UNKNOWN_ID}/activate`,
          ),
      },
      {
        label:
          'PATCH /api/products/:productId/variations/:variationId/deactivate',
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).patch(
              `/api/products/${UNKNOWN_ID}/variations/${UNKNOWN_ID}/deactivate`,
            ),
            operador.auth,
          ),
        anonymousCall: () =>
          request(app.getHttpServer()).patch(
            `/api/products/${UNKNOWN_ID}/variations/${UNKNOWN_ID}/deactivate`,
          ),
      },
      {
        label: 'POST /api/inventory/adjustments',
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).post('/api/inventory/adjustments'),
            operador.auth,
          ).send({
            variacaoId: UNKNOWN_ID,
            novoSaldo: 10,
            observacao: 'Ajuste de permissao',
          }),
        anonymousCall: () =>
          request(app.getHttpServer()).post('/api/inventory/adjustments').send({
            variacaoId: UNKNOWN_ID,
            novoSaldo: 10,
            observacao: 'Ajuste de permissao',
          }),
      },
      {
        label: 'GET /api/inventory/low-stock',
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).get('/api/inventory/low-stock'),
            operador.auth,
          ),
        anonymousCall: () =>
          request(app.getHttpServer()).get('/api/inventory/low-stock'),
      },
      {
        label: 'GET /api/caixa',
        operadorCall: () =>
          withAuth(request(app.getHttpServer()).get('/api/caixa'), operador.auth),
        anonymousCall: () => request(app.getHttpServer()).get('/api/caixa'),
      },
    ];

    for (const route of adminOnlyRoutes) {
      const operadorResponse = await route.operadorCall();
      expect(operadorResponse.status).toBe(403);
      expectApiError(operadorResponse.body, {
        status: 403,
        code: 'OPERATION_NOT_ALLOWED_FOR_ROLE',
      });

      const anonymousResponse = await route.anonymousCall();
      expect(anonymousResponse.status).toBe(401);
      expect(anonymousResponse.body.statusCode).toBe(401);
    }
  });

  it('allows ADMIN and OPERADOR on shared staff endpoints while rejecting anonymous', async () => {
    const app = await appPromise;
    const adminAuth = await loginAsAdmin(app);
    const operador = await createOperador(app, adminAuth, {
      email: 'operador.permissions@store.local',
    });

    const sharedRoutes = [
      {
        label: 'GET /api/variations/by-sku/:sku',
        adminCall: () =>
          withAuth(
            request(app.getHttpServer()).get('/api/variations/by-sku/SKU-INEXISTENTE'),
            adminAuth,
          ),
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).get('/api/variations/by-sku/SKU-INEXISTENTE'),
            operador.auth,
          ),
        anonymousCall: () =>
          request(app.getHttpServer()).get('/api/variations/by-sku/SKU-INEXISTENTE'),
      },
      {
        label: 'GET /api/variations/by-barcode/:barcode',
        adminCall: () =>
          withAuth(
            request(app.getHttpServer()).get(
              '/api/variations/by-barcode/789999999999',
            ),
            adminAuth,
          ),
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).get(
              '/api/variations/by-barcode/789999999999',
            ),
            operador.auth,
          ),
        anonymousCall: () =>
          request(app.getHttpServer()).get(
            '/api/variations/by-barcode/789999999999',
          ),
      },
      {
        label: 'GET /api/inventory/variations/:id/balance',
        adminCall: () =>
          withAuth(
            request(app.getHttpServer()).get(
              `/api/inventory/variations/${UNKNOWN_ID}/balance`,
            ),
            adminAuth,
          ),
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).get(
              `/api/inventory/variations/${UNKNOWN_ID}/balance`,
            ),
            operador.auth,
          ),
        anonymousCall: () =>
          request(app.getHttpServer()).get(
            `/api/inventory/variations/${UNKNOWN_ID}/balance`,
          ),
      },
      {
        label: 'GET /api/inventory/variations/:id/movements',
        adminCall: () =>
          withAuth(
            request(app.getHttpServer()).get(
              `/api/inventory/variations/${UNKNOWN_ID}/movements?page=1&pageSize=10`,
            ),
            adminAuth,
          ),
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).get(
              `/api/inventory/variations/${UNKNOWN_ID}/movements?page=1&pageSize=10`,
            ),
            operador.auth,
          ),
        anonymousCall: () =>
          request(app.getHttpServer()).get(
            `/api/inventory/variations/${UNKNOWN_ID}/movements?page=1&pageSize=10`,
          ),
      },
      {
        label: 'POST /api/inventory/entries',
        adminCall: () =>
          withAuth(
            request(app.getHttpServer()).post('/api/inventory/entries'),
            adminAuth,
          ).send({
            variacaoId: UNKNOWN_ID,
            quantidade: 1,
            motivo: 'COMPRA',
          }),
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).post('/api/inventory/entries'),
            operador.auth,
          ).send({
            variacaoId: UNKNOWN_ID,
            quantidade: 1,
            motivo: 'COMPRA',
          }),
        anonymousCall: () =>
          request(app.getHttpServer()).post('/api/inventory/entries').send({
            variacaoId: UNKNOWN_ID,
            quantidade: 1,
            motivo: 'COMPRA',
          }),
      },
      {
        label: 'POST /api/inventory/exits',
        adminCall: () =>
          withAuth(
            request(app.getHttpServer()).post('/api/inventory/exits'),
            adminAuth,
          ).send({
            variacaoId: UNKNOWN_ID,
            quantidade: 1,
            motivo: 'AJUSTE',
          }),
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).post('/api/inventory/exits'),
            operador.auth,
          ).send({
            variacaoId: UNKNOWN_ID,
            quantidade: 1,
            motivo: 'AJUSTE',
          }),
        anonymousCall: () =>
          request(app.getHttpServer()).post('/api/inventory/exits').send({
            variacaoId: UNKNOWN_ID,
            quantidade: 1,
            motivo: 'AJUSTE',
          }),
      },
      {
        label: 'POST /api/caixa/abrir',
        adminCall: () =>
          withAuth(request(app.getHttpServer()).post('/api/caixa/abrir'), adminAuth)
            .send({ valorAbertura: 100 }),
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).post('/api/caixa/abrir'),
            operador.auth,
          ).send({ valorAbertura: 100 }),
        anonymousCall: () =>
          request(app.getHttpServer()).post('/api/caixa/abrir').send({
            valorAbertura: 100,
          }),
      },
      {
        label: 'GET /api/caixa/aberto',
        adminCall: () =>
          withAuth(request(app.getHttpServer()).get('/api/caixa/aberto'), adminAuth),
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).get('/api/caixa/aberto'),
            operador.auth,
          ),
        anonymousCall: () => request(app.getHttpServer()).get('/api/caixa/aberto'),
      },
      {
        label: 'GET /api/caixa/minhas',
        adminCall: () =>
          withAuth(request(app.getHttpServer()).get('/api/caixa/minhas'), adminAuth),
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).get('/api/caixa/minhas'),
            operador.auth,
          ),
        anonymousCall: () => request(app.getHttpServer()).get('/api/caixa/minhas'),
      },
      {
        label: 'GET /api/caixa/:id',
        adminCall: () =>
          withAuth(
            request(app.getHttpServer()).get(`/api/caixa/${UNKNOWN_ID}`),
            adminAuth,
          ),
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).get(`/api/caixa/${UNKNOWN_ID}`),
            operador.auth,
          ),
        anonymousCall: () =>
          request(app.getHttpServer()).get(`/api/caixa/${UNKNOWN_ID}`),
      },
      {
        label: 'GET /api/caixa/:id/resumo',
        adminCall: () =>
          withAuth(
            request(app.getHttpServer()).get(`/api/caixa/${UNKNOWN_ID}/resumo`),
            adminAuth,
          ),
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).get(`/api/caixa/${UNKNOWN_ID}/resumo`),
            operador.auth,
          ),
        anonymousCall: () =>
          request(app.getHttpServer()).get(`/api/caixa/${UNKNOWN_ID}/resumo`),
      },
      {
        label: 'GET /api/caixa/:id/movimentacoes',
        adminCall: () =>
          withAuth(
            request(app.getHttpServer()).get(
              `/api/caixa/${UNKNOWN_ID}/movimentacoes?page=1&pageSize=10`,
            ),
            adminAuth,
          ),
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).get(
              `/api/caixa/${UNKNOWN_ID}/movimentacoes?page=1&pageSize=10`,
            ),
            operador.auth,
          ),
        anonymousCall: () =>
          request(app.getHttpServer()).get(
            `/api/caixa/${UNKNOWN_ID}/movimentacoes?page=1&pageSize=10`,
          ),
      },
      {
        label: 'GET /api/caixa/:id/vendas',
        adminCall: () =>
          withAuth(
            request(app.getHttpServer()).get(
              `/api/caixa/${UNKNOWN_ID}/vendas?page=1&pageSize=10`,
            ),
            adminAuth,
          ),
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).get(
              `/api/caixa/${UNKNOWN_ID}/vendas?page=1&pageSize=10`,
            ),
            operador.auth,
          ),
        anonymousCall: () =>
          request(app.getHttpServer()).get(
            `/api/caixa/${UNKNOWN_ID}/vendas?page=1&pageSize=10`,
          ),
      },
      {
        label: 'POST /api/caixa/:id/sangria',
        adminCall: () =>
          withAuth(
            request(app.getHttpServer()).post(`/api/caixa/${UNKNOWN_ID}/sangria`),
            adminAuth,
          ).send({ valor: 10, observacao: 'Sangria teste' }),
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).post(`/api/caixa/${UNKNOWN_ID}/sangria`),
            operador.auth,
          ).send({ valor: 10, observacao: 'Sangria teste' }),
        anonymousCall: () =>
          request(app.getHttpServer()).post(`/api/caixa/${UNKNOWN_ID}/sangria`).send({
            valor: 10,
            observacao: 'Sangria teste',
          }),
      },
      {
        label: 'POST /api/caixa/:id/suprimento',
        adminCall: () =>
          withAuth(
            request(app.getHttpServer()).post(`/api/caixa/${UNKNOWN_ID}/suprimento`),
            adminAuth,
          ).send({ valor: 10, observacao: 'Suprimento teste' }),
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).post(`/api/caixa/${UNKNOWN_ID}/suprimento`),
            operador.auth,
          ).send({ valor: 10, observacao: 'Suprimento teste' }),
        anonymousCall: () =>
          request(app.getHttpServer())
            .post(`/api/caixa/${UNKNOWN_ID}/suprimento`)
            .send({
              valor: 10,
              observacao: 'Suprimento teste',
            }),
      },
      {
        label: 'POST /api/caixa/:id/fechar',
        adminCall: () =>
          withAuth(
            request(app.getHttpServer()).post(`/api/caixa/${UNKNOWN_ID}/fechar`),
            adminAuth,
          ).send({ valorFechamento: 100 }),
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).post(`/api/caixa/${UNKNOWN_ID}/fechar`),
            operador.auth,
          ).send({ valorFechamento: 100 }),
        anonymousCall: () =>
          request(app.getHttpServer()).post(`/api/caixa/${UNKNOWN_ID}/fechar`).send({
            valorFechamento: 100,
          }),
      },
      {
        label: 'POST /api/vendas',
        adminCall: () =>
          withAuth(request(app.getHttpServer()).post('/api/vendas'), adminAuth).send(
            {},
          ),
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).post('/api/vendas'),
            operador.auth,
          ).send({}),
        anonymousCall: () => request(app.getHttpServer()).post('/api/vendas').send({}),
      },
      {
        label: 'POST /api/vendas/:id/itens',
        adminCall: () =>
          withAuth(
            request(app.getHttpServer()).post(`/api/vendas/${UNKNOWN_ID}/itens`),
            adminAuth,
          ).send({
            variacaoId: UNKNOWN_ID,
            quantidade: 1,
          }),
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).post(`/api/vendas/${UNKNOWN_ID}/itens`),
            operador.auth,
          ).send({
            variacaoId: UNKNOWN_ID,
            quantidade: 1,
          }),
        anonymousCall: () =>
          request(app.getHttpServer()).post(`/api/vendas/${UNKNOWN_ID}/itens`).send({
            variacaoId: UNKNOWN_ID,
            quantidade: 1,
          }),
      },
      {
        label: 'PATCH /api/vendas/:id/itens/:itemId/quantidade',
        adminCall: () =>
          withAuth(
            request(app.getHttpServer()).patch(
              `/api/vendas/${UNKNOWN_ID}/itens/${UNKNOWN_ITEM_ID}/quantidade`,
            ),
            adminAuth,
          ).send({ quantidade: 2 }),
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).patch(
              `/api/vendas/${UNKNOWN_ID}/itens/${UNKNOWN_ITEM_ID}/quantidade`,
            ),
            operador.auth,
          ).send({ quantidade: 2 }),
        anonymousCall: () =>
          request(app.getHttpServer())
            .patch(`/api/vendas/${UNKNOWN_ID}/itens/${UNKNOWN_ITEM_ID}/quantidade`)
            .send({ quantidade: 2 }),
      },
      {
        label: 'DELETE /api/vendas/:id/itens/:itemId',
        adminCall: () =>
          withAuth(
            request(app.getHttpServer()).delete(
              `/api/vendas/${UNKNOWN_ID}/itens/${UNKNOWN_ITEM_ID}`,
            ),
            adminAuth,
          ),
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).delete(
              `/api/vendas/${UNKNOWN_ID}/itens/${UNKNOWN_ITEM_ID}`,
            ),
            operador.auth,
          ),
        anonymousCall: () =>
          request(app.getHttpServer()).delete(
            `/api/vendas/${UNKNOWN_ID}/itens/${UNKNOWN_ITEM_ID}`,
          ),
      },
      {
        label: 'PATCH /api/vendas/:id/desconto',
        adminCall: () =>
          withAuth(
            request(app.getHttpServer()).patch(`/api/vendas/${UNKNOWN_ID}/desconto`),
            adminAuth,
          ).send({ tipo: 'valor', valor: 1 }),
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).patch(`/api/vendas/${UNKNOWN_ID}/desconto`),
            operador.auth,
          ).send({ tipo: 'valor', valor: 1 }),
        anonymousCall: () =>
          request(app.getHttpServer())
            .patch(`/api/vendas/${UNKNOWN_ID}/desconto`)
            .send({ tipo: 'valor', valor: 1 }),
      },
      {
        label: 'POST /api/vendas/:id/pagamentos',
        adminCall: () =>
          withAuth(
            request(app.getHttpServer()).post(`/api/vendas/${UNKNOWN_ID}/pagamentos`),
            adminAuth,
          ).send({ forma: 'DINHEIRO', valor: 1 }),
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).post(`/api/vendas/${UNKNOWN_ID}/pagamentos`),
            operador.auth,
          ).send({ forma: 'DINHEIRO', valor: 1 }),
        anonymousCall: () =>
          request(app.getHttpServer())
            .post(`/api/vendas/${UNKNOWN_ID}/pagamentos`)
            .send({ forma: 'DINHEIRO', valor: 1 }),
      },
      {
        label: 'POST /api/vendas/:id/finalizar',
        adminCall: () =>
          withAuth(
            request(app.getHttpServer()).post(`/api/vendas/${UNKNOWN_ID}/finalizar`),
            adminAuth,
          ).send({
            pagamentos: [{ forma: 'DINHEIRO', valor: 1 }],
          }),
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).post(`/api/vendas/${UNKNOWN_ID}/finalizar`),
            operador.auth,
          ).send({
            pagamentos: [{ forma: 'DINHEIRO', valor: 1 }],
          }),
        anonymousCall: () =>
          request(app.getHttpServer())
            .post(`/api/vendas/${UNKNOWN_ID}/finalizar`)
            .send({
              pagamentos: [{ forma: 'DINHEIRO', valor: 1 }],
            }),
      },
      {
        label: 'POST /api/vendas/:id/cancelar',
        adminCall: () =>
          withAuth(
            request(app.getHttpServer()).post(`/api/vendas/${UNKNOWN_ID}/cancelar`),
            adminAuth,
          ).send({}),
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).post(`/api/vendas/${UNKNOWN_ID}/cancelar`),
            operador.auth,
          ).send({}),
        anonymousCall: () =>
          request(app.getHttpServer()).post(`/api/vendas/${UNKNOWN_ID}/cancelar`).send(
            {},
          ),
      },
      {
        label: 'GET /api/vendas/resumo',
        adminCall: () =>
          withAuth(request(app.getHttpServer()).get('/api/vendas/resumo'), adminAuth),
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).get('/api/vendas/resumo'),
            operador.auth,
          ),
        anonymousCall: () => request(app.getHttpServer()).get('/api/vendas/resumo'),
      },
      {
        label: 'GET /api/vendas/:id',
        adminCall: () =>
          withAuth(
            request(app.getHttpServer()).get(`/api/vendas/${UNKNOWN_ID}`),
            adminAuth,
          ),
        operadorCall: () =>
          withAuth(
            request(app.getHttpServer()).get(`/api/vendas/${UNKNOWN_ID}`),
            operador.auth,
          ),
        anonymousCall: () =>
          request(app.getHttpServer()).get(`/api/vendas/${UNKNOWN_ID}`),
      },
      {
        label: 'GET /api/vendas',
        adminCall: () =>
          withAuth(request(app.getHttpServer()).get('/api/vendas'), adminAuth),
        operadorCall: () =>
          withAuth(request(app.getHttpServer()).get('/api/vendas'), operador.auth),
        anonymousCall: () => request(app.getHttpServer()).get('/api/vendas'),
      },
    ];

    for (const route of sharedRoutes) {
      const adminResponse = await route.adminCall();
      expectAllowedStatus(adminResponse.status);

      const operadorResponse = await route.operadorCall();
      expectAllowedStatus(operadorResponse.status);

      const anonymousResponse = await route.anonymousCall();
      expect(anonymousResponse.status).toBe(401);
      expect(anonymousResponse.body.statusCode).toBe(401);
    }
  });

  it('blocks cross-operator cash-session reads but allows ADMIN', async () => {
    const app = await appPromise;
    const adminAuth = await loginAsAdmin(app);
    const operadorA = await createOperador(app, adminAuth, {
      email: 'operador.a@store.local',
    });
    const operadorB = await createOperador(app, adminAuth, {
      email: 'operador.b@store.local',
    });

    const sessao = await abrirCaixa(app, operadorA.auth, {
      valorAbertura: 150,
    });

    const foreignRead = await withAuth(
      request(app.getHttpServer()).get(`/api/caixa/${sessao.id}`),
      operadorB.auth,
    ).expect(403);

    expectApiError(foreignRead.body, {
      status: 403,
      code: 'ACESSO_NEGADO',
    });

    const adminRead = await withAuth(
      request(app.getHttpServer()).get(`/api/caixa/${sessao.id}`),
      adminAuth,
    ).expect(200);

    expect(adminRead.body).toMatchObject({
      id: sessao.id,
      operadorId: operadorA.createdUser.id,
      status: 'ABERTA',
    });
  });

  it('blocks cross-operator sale reads but allows ADMIN', async () => {
    const app = await appPromise;
    const adminAuth = await loginAsAdmin(app);
    const operadorA = await createOperador(app, adminAuth, {
      email: 'operador.sale.a@store.local',
    });
    const operadorB = await createOperador(app, adminAuth, {
      email: 'operador.sale.b@store.local',
    });

    await abrirCaixa(app, operadorA.auth, {
      valorAbertura: 120,
    });

    const venda = await withAuth(
      request(app.getHttpServer()).post('/api/vendas'),
      operadorA.auth,
    )
      .send({})
      .expect(201);

    const foreignRead = await withAuth(
      request(app.getHttpServer()).get(`/api/vendas/${venda.body.id}`),
      operadorB.auth,
    ).expect(403);

    expectApiError(foreignRead.body, {
      status: 403,
      code: 'ACESSO_NEGADO',
    });

    const adminRead = await withAuth(
      request(app.getHttpServer()).get(`/api/vendas/${venda.body.id}`),
      adminAuth,
    ).expect(200);

    expect(adminRead.body).toMatchObject({
      id: venda.body.id,
      usuarioId: operadorA.createdUser.id,
    });
  });

  it('blocks sangria on another operador session and rejects anonymous', async () => {
    const app = await appPromise;
    const adminAuth = await loginAsAdmin(app);
    const operadorA = await createOperador(app, adminAuth, {
      email: 'operador.cash.a@store.local',
    });
    const operadorB = await createOperador(app, adminAuth, {
      email: 'operador.cash.b@store.local',
    });

    const sessao = await abrirCaixa(app, operadorA.auth, {
      valorAbertura: 80,
    });

    const foreignSangria = await withAuth(
      request(app.getHttpServer()).post(`/api/caixa/${sessao.id}/sangria`),
      operadorB.auth,
    )
      .send({ valor: 10, observacao: 'Tentativa indevida' })
      .expect(403);

    expectApiError(foreignSangria.body, {
      status: 403,
      code: 'NAO_E_DONO_DO_CAIXA',
    });

    await request(app.getHttpServer())
      .post(`/api/caixa/${sessao.id}/sangria`)
      .send({ valor: 10, observacao: 'Anonimo' })
      .expect(401);
  });
});
