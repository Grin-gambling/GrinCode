# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: market.spec.ts >> opens bet modal when clicking the bar
- Location: tests/market.spec.ts:40:1

# Error details

```
Error: locator.click: Test ended.
Call log:
  - waiting for locator('[style*="4caf50"]').first()

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | // Reusable mock market data
  4  | const mockMarkets = [
  5  |   {
  6  |     id: 'm1', question: 'Will it rain tomorrow?', description: 'Weather bet',
  7  |     status: 'open', closes_at: new Date(Date.now() + 86400000).toISOString(),
  8  |     winning_outcome_id: null, outcome_id: 'o1', label: 'Yes',
  9  |     total_amount: 100, total_upvotes: 5, total_downvotes: 1,
  10 |   },
  11 |   {
  12 |     id: 'm1', question: 'Will it rain tomorrow?', description: 'Weather bet',
  13 |     status: 'open', closes_at: new Date(Date.now() + 86400000).toISOString(),
  14 |     winning_outcome_id: null, outcome_id: 'o2', label: 'No',
  15 |     total_amount: 200, total_upvotes: 5, total_downvotes: 1,
  16 |   },
  17 | ];
  18 | 
  19 | test.beforeEach(async ({ page }) => {
  20 |   await page.route('/api/markets', route =>
  21 |     route.fulfill({ status: 200, body: JSON.stringify(mockMarkets) })
  22 |   );
  23 |   await page.route('/api/leaderboard', route =>
  24 |     route.fulfill({ status: 200, body: JSON.stringify([]) })
  25 |   );
  26 |   await page.goto('/');
  27 | });
  28 | 
  29 | test('displays bet post title and content', async ({ page }) => {
  30 |   await expect(page.getByText('Will it rain tomorrow?')).toBeVisible();
  31 |   await expect(page.getByText('Weather bet')).toBeVisible();
  32 | });
  33 | 
  34 | test('shows percentage split on the bet bar', async ({ page }) => {
  35 |   // 100 yes / 300 total = 33.3%, 200 no / 300 total = 66.7%
  36 |   await expect(page.getByText('Yes: 33.3%')).toBeVisible();
  37 |   await expect(page.getByText('No: 66.7%')).toBeVisible();
  38 | });
  39 | 
  40 | test('opens bet modal when clicking the bar', async ({ page }) => {
  41 |   // Click the green (left) side of the progress bar
> 42 |   await page.locator('[style*="4caf50"]').first().click();
     |                                                   ^ Error: locator.click: Test ended.
  43 |   await expect(page.getByText('Yes')).toBeVisible(); // side selector in modal
  44 | });
  45 | 
  46 | test('bet modal requires a side selection and amount', async ({ page }) => {
  47 |   await page.locator('[style*="4caf50"]').first().click();
  48 |   // Try to place bet without selecting side or amount — button should not submit
  49 |   const betButton = page.getByRole('button', { name: /Place.*acorn bet/ });
  50 |   await betButton.click();
  51 |   // The modal should still be open (bet wasn't placed)
  52 |   await expect(betButton).toBeVisible();
  53 | });
  54 | 
  55 | test('shows comments section when Comments button is clicked', async ({ page }) => {
  56 |   await page.route('/api/markets/m1/comments', route =>
  57 |     route.fulfill({ status: 200, body: JSON.stringify([]) })
  58 |   );
  59 | 
  60 |   await page.getByRole('button', { name: /Comments/ }).first().click();
  61 |   await expect(page.getByText('No comments yet.')).toBeVisible();
  62 | });
  63 | 
  64 | test('can post a comment', async ({ page }) => {
  65 |   await page.route('/api/markets/m1/comments', route => {
  66 |     if (route.request().method() === 'GET') {
  67 |       return route.fulfill({ status: 200, body: JSON.stringify([]) });
  68 |     }
  69 |     return route.fulfill({
  70 |       status: 201,
  71 |       body: JSON.stringify({ id: 'c1', market_id: 'm1', body: 'Great bet!', created_at: '' }),
  72 |     });
  73 |   });
  74 | 
  75 |   await page.getByRole('button', { name: /Comments/ }).first().click();
  76 |   await page.getByPlaceholder('Write a comment...').fill('Great bet!');
  77 |   await page.getByRole('button', { name: 'Post' }).click();
  78 |   await expect(page.getByText('Comment: Great bet!')).toBeVisible();
  79 | });
```