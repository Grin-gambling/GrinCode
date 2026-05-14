import { test, expect } from '@playwright/test';

// Reusable mock market data
const mockMarkets = [
  {
    id: 'm1', question: 'Will it rain tomorrow?', description: 'Weather bet',
    status: 'open', closes_at: new Date(Date.now() + 86400000).toISOString(),
    winning_outcome_id: null, outcome_id: 'o1', label: 'Yes',
    total_amount: 100, total_upvotes: 5, total_downvotes: 1,
  },
  {
    id: 'm1', question: 'Will it rain tomorrow?', description: 'Weather bet',
    status: 'open', closes_at: new Date(Date.now() + 86400000).toISOString(),
    winning_outcome_id: null, outcome_id: 'o2', label: 'No',
    total_amount: 200, total_upvotes: 5, total_downvotes: 1,
  },
];

test.beforeEach(async ({ page }) => {
  await page.route('/api/markets', route =>
    route.fulfill({ status: 200, body: JSON.stringify(mockMarkets) })
  );
  await page.route('/api/leaderboard', route =>
    route.fulfill({ status: 200, body: JSON.stringify([]) })
  );
  await page.goto('/');
});

test('displays bet post title and content', async ({ page }) => {
  await expect(page.getByText('Will it rain tomorrow?')).toBeVisible();
  await expect(page.getByText('Weather bet')).toBeVisible();
});

test('shows percentage split on the bet bar', async ({ page }) => {
  // 100 yes / 300 total = 33.3%, 200 no / 300 total = 66.7%
  await expect(page.getByText('Yes: 33.3%')).toBeVisible();
  await expect(page.getByText('No: 66.7%')).toBeVisible();
});

test('opens bet modal when clicking the bar', async ({ page }) => {
  // Click the green (left) side of the progress bar
  await page.locator('[style*="4caf50"]').first().click();
  await expect(page.getByText('Yes')).toBeVisible(); // side selector in modal
});

test('bet modal requires a side selection and amount', async ({ page }) => {
  await page.locator('[style*="4caf50"]').first().click();
  // Try to place bet without selecting side or amount — button should not submit
  const betButton = page.getByRole('button', { name: /Place.*acorn bet/ });
  await betButton.click();
  // The modal should still be open (bet wasn't placed)
  await expect(betButton).toBeVisible();
});

test('shows comments section when Comments button is clicked', async ({ page }) => {
  await page.route('/api/markets/m1/comments', route =>
    route.fulfill({ status: 200, body: JSON.stringify([]) })
  );

  await page.getByRole('button', { name: /Comments/ }).first().click();
  await expect(page.getByText('No comments yet.')).toBeVisible();
});

test('can post a comment', async ({ page }) => {
  await page.route('/api/markets/m1/comments', route => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ status: 200, body: JSON.stringify([]) });
    }
    return route.fulfill({
      status: 201,
      body: JSON.stringify({ id: 'c1', market_id: 'm1', body: 'Great bet!', created_at: '' }),
    });
  });

  await page.getByRole('button', { name: /Comments/ }).first().click();
  await page.getByPlaceholder('Write a comment...').fill('Great bet!');
  await page.getByRole('button', { name: 'Post' }).click();
  await expect(page.getByText('Comment: Great bet!')).toBeVisible();
});