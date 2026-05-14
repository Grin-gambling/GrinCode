import { test, expect } from '@playwright/test';

test('leaderboard ranks players by acorns descending', async ({ page }) => {
  await page.route('/api/markets', route =>
    route.fulfill({ status: 200, body: JSON.stringify([]) })
  );
  await page.route('/api/leaderboard', route =>
    route.fulfill({
      status: 200,
      body: JSON.stringify([
        { id: '1', username: 'alice', balance: 500 },
        { id: '2', username: 'bob', balance: 1500 },
        { id: '3', username: 'carol', balance: 800 },
      ]),
    })
  );

  await page.goto('/');

  const rows = page.locator('[style*="justifyContent: space-between"]');
  // Bob (1500) should appear before Carol (800) before Alice (500)
  const firstRow = rows.nth(0);
  const secondRow = rows.nth(1);
  await expect(firstRow).toContainText('bob');
  await expect(secondRow).toContainText('carol');
});