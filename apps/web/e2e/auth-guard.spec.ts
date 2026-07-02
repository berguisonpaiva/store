import { expect, test } from '@playwright/test';
import { createOperatorViaApi, resetBackendState } from './support/backend';
import { loginThroughUi } from './support/ui';

test.beforeEach(async ({ context, request }) => {
  await resetBackendState(request);
  await context.clearCookies();
});

test('admin can log in through the UI', async ({ page }) => {
  await loginThroughUi(page, {
    email: 'admin@store.local',
    password: 'Admin!123',
  });

  await expect(
    page.getByRole('heading', { level: 1, name: 'Dashboard' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Usuários' })).toBeVisible();
});

test('unauthenticated access to admin routes redirects to login', async ({
  page,
}) => {
  await page.goto('/usuarios');

  await expect(page).toHaveURL(/\/join$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Entrar' }),
  ).toBeVisible();
});

test('operator navigation hides admin-only areas and redirects direct admin access', async ({
  page,
  request,
}) => {
  const operator = await createOperatorViaApi(request);

  await loginThroughUi(page, operator);

  await expect(page.getByRole('link', { name: 'Início' })).toBeVisible();

  for (const label of [
    'Vendas',
    'Caixas',
    'Produtos',
    'Categorias',
    'Estoque',
    'Usuários',
  ]) {
    await expect(page.getByRole('link', { name: label })).toHaveCount(0);
  }

  await page.goto('/usuarios');
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Dashboard' }),
  ).toBeVisible();
});
