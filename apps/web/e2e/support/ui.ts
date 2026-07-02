import { expect, type Page } from '@playwright/test';

export async function loginThroughUi(
  page: Page,
  credentials: { email: string; password: string },
): Promise<void> {
  await page.goto('/join');
  await page.getByLabel('Email').fill(credentials.email);
  await page.getByLabel('Senha').fill(credentials.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}
