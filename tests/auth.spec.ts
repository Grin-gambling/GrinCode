import { test, expect } from '@playwright/test';

test.describe('Login modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Login' }).click();
  });

  test('opens when Login button is clicked', async ({ page }) => {
    await expect(page.getByText('Welcome back!')).toBeVisible();
  });

  test('closes when × button is clicked', async ({ page }) => {
    await page.getByRole('button', { name: '×' }).click();
    await expect(page.getByText('Welcome back!')).not.toBeVisible();
  });

  test('shows validation errors on empty submit', async ({ page }) => {
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page.getByText('*Email* is mandatory')).toBeVisible();
    await expect(page.getByText('*Password* is mandatory')).toBeVisible();
  });

  test('shows error message on bad credentials', async ({ page }) => {
    // Mock the API to return a 401
    await page.route('/api/auth/login', route =>
      route.fulfill({ status: 401, body: JSON.stringify({ error: 'Invalid credentials' }) })
    );

    await page.getByPlaceholder('Email').fill('bad@example.com');
    await page.getByPlaceholder('Password').fill('wrongpass');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page.getByText('Invalid credentials')).toBeVisible();
  });

  test('closes and shows username on successful login', async ({ page }) => {
    await page.route('/api/auth/login', route =>
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          token: 'fake-token',
          user: { id: '1', username: 'testuser', email: 'test@test.com', balance: 500, created_at: '' },
        }),
      })
    );
    // /api/auth/me is called after login to refresh user
    await page.route('/api/auth/me', route =>
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: { id: '1', username: 'testuser', email: 'test@test.com', balance: 500, created_at: '' },
        }),
      })
    );

    await page.getByPlaceholder('Email').fill('test@test.com');
    await page.getByPlaceholder('Password').fill('password123');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page.getByRole('button', { name: /Log Out \(testuser\)/ })).toBeVisible();
  });
});

test.describe('Registration modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Sign up' }).click();
  });

  test('opens when Sign up button is clicked', async ({ page }) => {
    await expect(page.getByText('Sign up to gamble today!')).toBeVisible();
  });

  test('validates password minimum length', async ({ page }) => {
    await page.getByPlaceholder('Username').fill('newuser');
    await page.getByPlaceholder('Email').fill('new@test.com');
    await page.getByPlaceholder('Password').fill('short');
    await page.getByRole('button', { name: 'Sign up' }).click();

    await expect(page.getByText('*Password* must be at least 8 characters')).toBeVisible();
  });
});