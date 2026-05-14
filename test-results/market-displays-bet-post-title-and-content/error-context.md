# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: market.spec.ts >> displays bet post title and content
- Location: tests/market.spec.ts:29:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Will it rain tomorrow?')
Expected: visible
Error: strict mode violation: getByText('Will it rain tomorrow?') resolved to 2 elements:
    1) <h3>Will it rain tomorrow?</h3> aka getByRole('heading', { name: 'Will it rain tomorrow?' })
    2) <div>Will it rain tomorrow?</div> aka locator('div').filter({ hasText: /^Will it rain tomorrow\?$/ })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Will it rain tomorrow?')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - img "Website Banner" [ref=e5]
    - heading "G R I N G A M B L I N G" [level=1] [ref=e6]
    - generic [ref=e7]:
      - generic [ref=e8]: Acorns
      - generic [ref=e9]: "1000"
  - generic [ref=e10]:
    - button "Market" [ref=e11] [cursor=pointer]
    - button "Minigames" [ref=e12] [cursor=pointer]
    - button "Create Bet" [ref=e13] [cursor=pointer]
    - button "Login" [ref=e14] [cursor=pointer]
    - button "Sign up" [ref=e15] [cursor=pointer]
  - generic [ref=e17]:
    - generic [ref=e19]:
      - generic [ref=e20]:
        - heading "Will it rain tomorrow?" [level=3] [ref=e21]
        - generic [ref=e23]: "Time remaining: 23h 59m 59s"
      - paragraph [ref=e24]: Weather bet
      - generic [ref=e25]:
        - generic [ref=e26]: "Yes: 33.3%"
        - generic [ref=e27]: "No: 66.7%"
      - generic [ref=e28]:
        - generic [ref=e29] [cursor=pointer]: 33.3%
        - generic [ref=e30] [cursor=pointer]: 66.7%
      - generic [ref=e31]:
        - button "↑" [ref=e32] [cursor=pointer]
        - generic [ref=e33]: "4"
        - button "↓" [ref=e34] [cursor=pointer]
        - button "Show Comments" [ref=e35] [cursor=pointer]
        - button "Report" [ref=e37] [cursor=pointer]
    - generic [ref=e38]:
      - heading "Leaderboard" [level=2] [ref=e41]
      - generic [ref=e43]:
        - heading "Top Bets" [level=2] [ref=e44]
        - generic [ref=e45]:
          - generic [ref=e46]: Will it rain tomorrow?
          - generic [ref=e47]: "Pool: 300 acorns"
          - generic [ref=e48]: "Yes: 100 | No: 200"
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
> 30 |   await expect(page.getByText('Will it rain tomorrow?')).toBeVisible();
     |                                                          ^ Error: expect(locator).toBeVisible() failed
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
  42 |   await page.locator('[style*="4caf50"]').first().click();
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