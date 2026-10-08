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

  await page.getByLabel('Senha atual').fill('nightmare123');
  await page.getByLabel('Nova senha').fill('nightmare456');
  await page.getByRole('button', { name: 'Alterar senha' }).click();
  await expect(page.getByRole('status')).toContainText('Senha alterada');

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

  const email = `managed-${Date.now()}@example.test`;
  const signup = await page.request.post('/api/auth/sign-up/email', {
    data: { name: 'Managed QA', email, password: 'nightmare123' },
  });
  expect(signup.ok()).toBeTruthy();

  await page.goto('/dev/email-outbox');
  const verificationEmail = page
    .locator('.outbox-card')
    .filter({ hasText: email })
    .last();
  const verificationHref = await verificationEmail
    .getByRole('link', { name: 'Confirmar endereço' })
    .getAttribute('href');
  expect(verificationHref).toBeTruthy();
  const verificationResponse = await page.request.get(verificationHref ?? '');
  expect(verificationResponse.ok()).toBeTruthy();

  await page.goto('/admin');
  const account = page
    .locator('.admin-account-card')
    .filter({ hasText: email });
  await account.getByLabel('Motivo da decisão').fill('Teste de bloqueio');
  await account.getByRole('button', { name: 'Bloquear' }).click();
  await expect(
    page.locator('.admin-account-card').filter({ hasText: email }),
  ).toContainText('bloqueada');

  const playerPage = await page.context().newPage();
  await playerPage.goto('/login');
  await playerPage.getByLabel('E-mail').fill(email);
  await playerPage.getByLabel('Senha').fill('nightmare123');
  await playerPage.getByRole('button', { name: 'Entrar' }).click();
  await expect(playerPage.getByRole('alert')).toContainText(/bloquead|banid/i);
  await playerPage.close();

  const blockedAccount = page
    .locator('.admin-account-card')
    .filter({ hasText: email });
  await blockedAccount
    .getByLabel('Motivo da decisão')
    .fill('Revisão concluída');
  await blockedAccount.getByRole('button', { name: 'Desbloquear' }).click();
  await expect(
    page.locator('.admin-account-card').filter({ hasText: email }),
  ).toContainText('ativa');
});

test('player solicita recuperação e define uma nova senha', async ({
  page,
}) => {
  await page.goto('/reset-password?token=invalid');
  await page.waitForLoadState('networkidle');
  await page.getByLabel('Nova senha').fill('nightmare456');
  await page.getByLabel('Confirmar senha').fill('different789');
  await page.getByRole('button', { name: 'Salvar nova senha' }).click();
  await expect(page.getByRole('alert')).toContainText('não coincidem');

  await page.getByLabel('Confirmar senha').fill('nightmare456');
  await page.getByRole('button', { name: 'Salvar nova senha' }).click();
  await expect(page.getByRole('alert')).toContainText(/inválido|invalid/i);

  const email = `recovery-${Date.now()}@example.test`;
  const signup = await page.request.post('/api/auth/sign-up/email', {
    data: { name: 'Recovery QA', email, password: 'nightmare123' },
  });
  expect(signup.ok()).toBeTruthy();

  await page.goto('/dev/email-outbox');
  const verificationEmail = page
    .locator('.outbox-card')
    .filter({ hasText: email })
    .last();
  const verificationHref = await verificationEmail
    .getByRole('link', { name: 'Confirmar endereço' })
    .getAttribute('href');
  expect(verificationHref).toBeTruthy();
  const verificationResponse = await page.request.get(verificationHref ?? '');
  expect(verificationResponse.ok()).toBeTruthy();

  await page.goto('/forgot-password');
  await page.waitForLoadState('networkidle');
  await page.getByLabel('E-mail').fill(email);
  await page.getByRole('button', { name: 'Enviar instruções' }).click();
  await expect(page.getByRole('status')).toContainText('instruções');

  await page.goto('/dev/email-outbox');
  const resetEmail = page
    .locator('.outbox-card')
    .filter({ hasText: email })
    .filter({ hasText: 'Recuperação de senha' })
    .last();
  const resetHref = await resetEmail
    .getByRole('link', { name: 'Confirmar endereço' })
    .getAttribute('href');
  expect(resetHref).toBeTruthy();
  const resetResponse = await page.request.get(resetHref ?? '');
  expect(resetResponse.ok()).toBeTruthy();
  await page.goto(resetResponse.url());
  await expect(
    page.getByRole('button', { name: 'Salvar nova senha' }),
  ).toBeEnabled();
  await page.getByLabel('Nova senha').fill('nightmare456');
  await page.getByLabel('Confirmar senha').fill('nightmare456');
  await page.getByRole('button', { name: 'Salvar nova senha' }).click();
  await expect(page.getByRole('status')).toContainText('Senha alterada');

  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill('nightmare456');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/account$/);
});

test('admin publica notícia e visitante lê o artigo', async ({ page }) => {
  const adminEmail = process.env.E2E_ADMIN_EMAIL;
  const adminPassword = process.env.E2E_ADMIN_PASSWORD;
  test.skip(
    !adminEmail || !adminPassword,
    'Configure E2E_ADMIN_EMAIL e E2E_ADMIN_PASSWORD para o fluxo admin.',
  );

  await page.goto('/login');
  await page.getByLabel('E-mail').fill(adminEmail ?? '');
  await page.getByLabel('Senha').fill(adminPassword ?? '');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/account$/);

  const title = `Atualização QA ${Date.now()}`;
  await page.goto('/admin/news');
  await page.getByLabel('Título').fill(title);
  await page.getByLabel('Resumo').fill('Resumo da publicação de QA.');
  await page
    .getByLabel('Conteúdo')
    .fill('Conteúdo completo da publicação de QA.');
  await page.getByLabel('Categoria').fill('QA');
  await page.getByRole('button', { name: 'Publicar' }).click();

  await page.goto('/news');
  const post = page.locator('.news-post-preview').filter({ hasText: title });
  await expect(post).toBeVisible();
  await post.getByRole('link', { name: 'Ler notícia' }).click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await expect(
    page.getByText('Conteúdo completo da publicação de QA.'),
  ).toBeVisible();
});
