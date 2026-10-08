import { expect, test } from '@playwright/test';

test('player cria conta, confirma e-mail, entra e encerra sessão', async ({
  page,
}) => {
  const email = `player-${Date.now()}@example.test`;

  await page.goto('/account');
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/login$/);

  await page.goto('/register');
  await page.waitForLoadState('networkidle');
  await page.getByLabel('Nome de jogador').fill('Player QA');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill('nightmare123');
  await page.getByLabel('Aceito os termos do servidor').check();
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('status')).toContainText('Conta criada');

  await page.goto('/dev/email-outbox');
  const emailCard = page
    .locator('.outbox-card')
    .filter({ hasText: email })
    .last();
  await expect(emailCard).toBeVisible();
  await emailCard.getByRole('link', { name: 'Confirmar endereço' }).click();
  await expect(
    page.getByRole('heading', { name: 'Endereço confirmado' }),
  ).toBeVisible();

  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill('nightmare123');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/account$/);
  await page.waitForLoadState('networkidle');
  await expect(
    page.getByRole('heading', { name: 'Olá, Player QA' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('admin autenticado acessa o painel administrativo', async ({ page }) => {
  test.skip(
    !process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD,
    'credenciais locais de QA não configuradas',
  );

  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.getByLabel('E-mail').fill(process.env.E2E_ADMIN_EMAIL as string);
  await page.getByLabel('Senha').fill(process.env.E2E_ADMIN_PASSWORD as string);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/account$/);
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Painel' })).toBeVisible();
  await expect(page.getByText('admin', { exact: true })).toBeVisible();
});
