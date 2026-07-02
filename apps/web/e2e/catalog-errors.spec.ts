import { expect, test } from '@playwright/test';
import { resetBackendState } from './support/backend';
import { loginThroughUi } from './support/ui';

test.beforeEach(async ({ context, request }) => {
  await resetBackendState(request);
  await context.clearCookies();
});

test('duplicate category renders the localized error message', async ({
  page,
}) => {
  const categoryName = `Bebidas E2E ${Date.now()}`;

  await loginThroughUi(page, {
    email: 'admin@store.local',
    password: 'Admin!123',
  });

  await page.goto('/categories');

  await page.getByRole('button', { name: 'Nova categoria' }).click();
  await page.getByLabel('Nome').fill(categoryName);
  await page.getByRole('button', { name: 'Adicionar' }).click();

  await expect(page.getByText(categoryName)).toBeVisible();

  await page.getByRole('button', { name: 'Nova categoria' }).click();
  await page.getByLabel('Nome').fill(categoryName);
  await page.getByRole('button', { name: 'Adicionar' }).click();

  await expect(
    page.getByText('Já existe uma categoria com esse nome.'),
  ).toBeVisible();
  await expect(page.getByText('CATEGORY_ALREADY_EXISTS')).toHaveCount(0);
});
