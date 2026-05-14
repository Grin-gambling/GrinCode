# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: leaderboard.spec.ts >> leaderboard ranks players by acorns descending
- Location: tests/leaderboard.spec.ts:3:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('[style*="justifyContent: space-between"]').first()
Expected substring: "bob"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('[style*="justifyContent: space-between"]').first()

```

```yaml
- img "Website Banner"
- heading "G R I N G A M B L I N G" [level=1]
- text: Acorns 1000
- button "Market"
- button "Minigames"
- button "Create Bet"
- button "Login"
- button "Sign up"
- heading "Leaderboard" [level=2]
- text: 1. bob 1500 acorns 2. carol 800 acorns 3. alice 500 acorns
- heading "Top Bets" [level=2]
- text: No bets yet
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('leaderboard ranks players by acorns descending', async ({ page }) => {
  4  |   await page.route('/api/markets', route =>
  5  |     route.fulfill({ status: 200, body: JSON.stringify([]) })
  6  |   );
  7  |   await page.route('/api/leaderboard', route =>
  8  |     route.fulfill({
  9  |       status: 200,
  10 |       body: JSON.stringify([
  11 |         { id: '1', username: 'alice', balance: 500 },
  12 |         { id: '2', username: 'bob', balance: 1500 },
  13 |         { id: '3', username: 'carol', balance: 800 },
  14 |       ]),
  15 |     })
  16 |   );
  17 | 
  18 |   await page.goto('/');
  19 | 
  20 |   const rows = page.locator('[style*="justifyContent: space-between"]');
  21 |   // Bob (1500) should appear before Carol (800) before Alice (500)
  22 |   const firstRow = rows.nth(0);
  23 |   const secondRow = rows.nth(1);
> 24 |   await expect(firstRow).toContainText('bob');
     |                          ^ Error: expect(locator).toContainText(expected) failed
  25 |   await expect(secondRow).toContainText('carol');
  26 | });
```