import { test, expect } from '@playwright/test';

test('shows default guest acorn balance of 1000', async ({ page }) => {
  await page.goto('/');
  const acornBox = page.getByText('Acorns').locator('..');
  await expect(acornBox.getByText('1000')).toBeVisible();
});

test('updates acorn balance after login', async ({ page }) => {
  await page.route('/api/auth/login', route =>
    route.fulfill({
      status: 200,
      body: JSON.stringify({
        token: 'tok',
        user: { id: '1', username: 'alice', email: 'a@a.com', balance: 2500, created_at: '' },
      }),
    })
  );
  await page.route('/api/auth/me', route =>
    route.fulfill({
      status: 200,
      body: JSON.stringify({
        user: { id: '1', username: 'alice', email: 'a@a.com', balance: 2500, created_at: '' },
      }),
    })
  );

  await page.goto('/');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByPlaceholder('Email').fill('a@a.com');
  await page.getByPlaceholder('Password').fill('password123');
  await page.getByRole('button', { name: 'Log in' }).click();

  await expect(page.getByText('2500')).toBeVisible();
});