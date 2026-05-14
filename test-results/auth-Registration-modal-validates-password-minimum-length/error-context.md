# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Registration modal >> validates password minimum length
- Location: tests/auth.spec.ts:75:3

# Error details

```
Error: locator.click: Error: strict mode violation: getByRole('button', { name: 'Sign up' }) resolved to 2 elements:
    1) <button>Sign up</button> aka getByRole('button', { name: 'Sign up' }).first()
    2) <button>Sign up</button> aka locator('form').getByRole('button', { name: 'Sign up' })

Call log:
  - waiting for getByRole('button', { name: 'Sign up' })

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
    - generic [ref=e18]:
      - generic [ref=e19]:
        - generic [ref=e20]:
          - heading "Will Sam backflip" [level=3] [ref=e21]
          - generic [ref=e23]: "Time remaining: Closed"
        - paragraph [ref=e24]: probably?
        - generic [ref=e25]:
          - generic [ref=e26]: "No: 9.1%"
          - generic [ref=e27]: "Yes: 90.9%"
        - generic [ref=e28]:
          - generic [ref=e29]: 9.1%
          - generic [ref=e30]: 90.9%
        - generic [ref=e31]:
          - button "↑" [ref=e32] [cursor=pointer]
          - generic [ref=e33]: "0"
          - button "↓" [ref=e34] [cursor=pointer]
          - button "Show Comments" [ref=e35] [cursor=pointer]
          - button "Report" [ref=e37] [cursor=pointer]
        - paragraph [ref=e38]: "Resolved winner: Yes"
      - generic [ref=e39]:
        - generic [ref=e40]:
          - heading "Collin" [level=3] [ref=e41]
          - generic [ref=e43]: "Time remaining: Closed"
        - paragraph [ref=e44]: Marshall
        - generic [ref=e45]:
          - generic [ref=e46]: "Collin: 0.0%"
          - generic [ref=e47]: "Marshall: 100.0%"
        - generic [ref=e49]: 100.0%
        - generic [ref=e50]:
          - button "↑" [ref=e51] [cursor=pointer]
          - generic [ref=e52]: "1"
          - button "↓" [ref=e53] [cursor=pointer]
          - button "Show Comments" [ref=e54] [cursor=pointer]
          - button "Report" [ref=e56] [cursor=pointer]
        - paragraph [ref=e57]: "Resolved winner: Marshall"
      - generic [ref=e58]:
        - generic [ref=e59]:
          - heading "Canvas is functional" [level=3] [ref=e60]
          - generic [ref=e62]: "Time remaining: Closed"
        - paragraph [ref=e63]: probably can't do my work now
        - generic [ref=e64]:
          - generic [ref=e65]: "doesn't function: 100.0%"
          - generic [ref=e66]: "functions: 0.0%"
        - generic [ref=e68]: 100.0%
        - generic [ref=e69]:
          - button "↑" [ref=e70] [cursor=pointer]
          - generic [ref=e71]: "0"
          - button "↓" [ref=e72] [cursor=pointer]
          - button "Show Comments" [ref=e73] [cursor=pointer]
          - button "Report" [ref=e75] [cursor=pointer]
        - paragraph [ref=e76]: "Resolved winner: doesn't function"
      - generic [ref=e77]:
        - generic [ref=e78]:
          - heading "Chance PM will notice" [level=3] [ref=e79]
          - generic [ref=e81]: "Time remaining: Closed"
        - paragraph [ref=e82]: good boy
        - generic [ref=e83]:
          - generic [ref=e84]: "he doesn't: 50.0%"
          - generic [ref=e85]: "he notices : 50.0%"
        - generic [ref=e86]:
          - generic [ref=e87]: 50.0%
          - generic [ref=e88]: 50.0%
        - generic [ref=e89]:
          - button "↑" [ref=e90] [cursor=pointer]
          - generic [ref=e91]: "0"
          - button "↓" [ref=e92] [cursor=pointer]
          - button "Show Comments" [ref=e93] [cursor=pointer]
          - button "Report" [ref=e95] [cursor=pointer]
        - paragraph [ref=e96]: "Resolved winner: he doesn't"
      - generic [ref=e97]:
        - generic [ref=e98]:
          - heading "testing closing" [level=3] [ref=e99]
          - generic [ref=e101]: "Time remaining: Closed"
        - paragraph [ref=e102]: how does closing work
        - generic [ref=e103]:
          - generic [ref=e104]: "close: 71.4%"
          - generic [ref=e105]: "still close: 28.6%"
        - generic [ref=e106]:
          - generic [ref=e107]: 71.4%
          - generic [ref=e108]: 28.6%
        - generic [ref=e109]:
          - button "↑" [ref=e110] [cursor=pointer]
          - generic [ref=e111]: "0"
          - button "↓" [ref=e112] [cursor=pointer]
          - button "Show Comments" [ref=e113] [cursor=pointer]
          - button "Report" [ref=e115] [cursor=pointer]
        - paragraph [ref=e116]: "Resolved winner: close"
      - generic [ref=e117]:
        - generic [ref=e118]:
          - heading "4" [level=3] [ref=e119]
          - generic [ref=e121]: "Time remaining: Closed"
        - paragraph [ref=e122]: "3"
        - generic [ref=e123]:
          - generic [ref=e124]: "1: 50.0%"
          - generic [ref=e125]: "2: 50.0%"
        - generic [ref=e126]:
          - generic [ref=e127]: 50.0%
          - generic [ref=e128]: 50.0%
        - generic [ref=e129]:
          - button "↑" [ref=e130] [cursor=pointer]
          - generic [ref=e131]: "0"
          - button "↓" [ref=e132] [cursor=pointer]
          - button "Show Comments" [ref=e133] [cursor=pointer]
          - button "Report" [ref=e135] [cursor=pointer]
        - paragraph [ref=e136]: "Resolved winner: 1"
      - generic [ref=e137]:
        - generic [ref=e138]:
          - heading "1" [level=3] [ref=e139]
          - generic [ref=e141]: "Time remaining: 150d 13h 39m"
        - paragraph [ref=e142]: "2"
        - generic [ref=e143]:
          - generic [ref=e144]: "3: 50.0%"
          - generic [ref=e145]: "4: 50.0%"
        - generic [ref=e146]:
          - generic [ref=e147] [cursor=pointer]: 50.0%
          - generic [ref=e148] [cursor=pointer]: 50.0%
        - generic [ref=e149]:
          - button "↑" [ref=e150] [cursor=pointer]
          - generic [ref=e151]: "0"
          - button "↓" [ref=e152] [cursor=pointer]
          - button "Show Comments" [ref=e153] [cursor=pointer]
          - button "Report" [ref=e155] [cursor=pointer]
      - generic [ref=e156]:
        - generic [ref=e157]:
          - heading "will it rain at the Grinnellian" [level=3] [ref=e158]
          - generic [ref=e160]: "Time remaining: Closed"
        - paragraph [ref=e161]: see title
        - generic [ref=e162]:
          - generic [ref=e163]: "No: 84.6%"
          - generic [ref=e164]: "Yes: 15.4%"
        - generic [ref=e165]:
          - generic [ref=e166]: 84.6%
          - generic [ref=e167]: 15.4%
        - generic [ref=e168]:
          - button "↑" [ref=e169] [cursor=pointer]
          - generic [ref=e170]: "1"
          - button "↓" [ref=e171] [cursor=pointer]
          - button "Show Comments" [ref=e172] [cursor=pointer]
          - button "Report" [ref=e174] [cursor=pointer]
      - generic [ref=e175]:
        - generic [ref=e176]:
          - heading "123" [level=3] [ref=e177]
          - generic [ref=e179]: "Time remaining: Closed"
        - paragraph [ref=e180]: "12312"
        - generic [ref=e181]:
          - generic [ref=e182]: "213214: 66.7%"
          - generic [ref=e183]: "324: 33.3%"
        - generic [ref=e184]:
          - generic [ref=e185]: 66.7%
          - generic [ref=e186]: 33.3%
        - generic [ref=e187]:
          - button "↑" [ref=e188] [cursor=pointer]
          - generic [ref=e189]: "0"
          - button "↓" [ref=e190] [cursor=pointer]
          - button "Show Comments" [ref=e191] [cursor=pointer]
          - button "Report" [ref=e193] [cursor=pointer]
      - generic [ref=e194]:
        - generic [ref=e195]:
          - heading "fe" [level=3] [ref=e196]
          - generic [ref=e198]: "Time remaining: Closed"
        - paragraph [ref=e199]: f
        - generic [ref=e200]:
          - generic [ref=e201]: "g: 33.3%"
          - generic [ref=e202]: "ge: 66.7%"
        - generic [ref=e203]:
          - generic [ref=e204]: 33.3%
          - generic [ref=e205]: 66.7%
        - generic [ref=e206]:
          - button "↑" [ref=e207] [cursor=pointer]
          - generic [ref=e208]: "0"
          - button "↓" [ref=e209] [cursor=pointer]
          - button "Show Comments" [ref=e210] [cursor=pointer]
          - button "Report" [ref=e212] [cursor=pointer]
      - generic [ref=e213]:
        - generic [ref=e214]:
          - heading "5" [level=3] [ref=e215]
          - generic [ref=e217]: "Time remaining: Closed"
        - paragraph [ref=e218]: "5"
        - generic [ref=e219]:
          - generic [ref=e220]: "5: 50.0%"
          - generic [ref=e221]: "5: 50.0%"
        - generic [ref=e222]:
          - generic [ref=e223]: 50.0%
          - generic [ref=e224]: 50.0%
        - generic [ref=e225]:
          - button "↑" [ref=e226] [cursor=pointer]
          - generic [ref=e227]: "0"
          - button "↓" [ref=e228] [cursor=pointer]
          - button "Show Comments" [ref=e229] [cursor=pointer]
          - button "Report" [ref=e231] [cursor=pointer]
      - generic [ref=e232]:
        - generic [ref=e233]:
          - heading "4" [level=3] [ref=e234]
          - generic [ref=e236]: "Time remaining: Closed"
        - paragraph [ref=e237]: "4"
        - generic [ref=e238]:
          - generic [ref=e239]: "4: 50.0%"
          - generic [ref=e240]: "4: 50.0%"
        - generic [ref=e241]:
          - generic [ref=e242]: 50.0%
          - generic [ref=e243]: 50.0%
        - generic [ref=e244]:
          - button "↑" [ref=e245] [cursor=pointer]
          - generic [ref=e246]: "0"
          - button "↓" [ref=e247] [cursor=pointer]
          - button "Show Comments" [ref=e248] [cursor=pointer]
          - button "Report" [ref=e250] [cursor=pointer]
      - generic [ref=e251]:
        - generic [ref=e252]:
          - heading "2" [level=3] [ref=e253]
          - generic [ref=e255]: "Time remaining: Closed"
        - paragraph [ref=e256]: "2"
        - generic [ref=e257]:
          - generic [ref=e258]: "2: 50.0%"
          - generic [ref=e259]: "22: 50.0%"
        - generic [ref=e260]:
          - generic [ref=e261]: 50.0%
          - generic [ref=e262]: 50.0%
        - generic [ref=e263]:
          - button "↑" [ref=e264] [cursor=pointer]
          - generic [ref=e265]: "0"
          - button "↓" [ref=e266] [cursor=pointer]
          - button "Show Comments" [ref=e267] [cursor=pointer]
          - button "Report" [ref=e269] [cursor=pointer]
      - generic [ref=e270]:
        - generic [ref=e271]:
          - heading "1" [level=3] [ref=e272]
          - generic [ref=e274]: "Time remaining: Closed"
        - paragraph [ref=e275]: "1"
        - generic [ref=e276]:
          - generic [ref=e277]: "1: 50.0%"
          - generic [ref=e278]: "1: 50.0%"
        - generic [ref=e279]:
          - generic [ref=e280]: 50.0%
          - generic [ref=e281]: 50.0%
        - generic [ref=e282]:
          - button "↑" [ref=e283] [cursor=pointer]
          - generic [ref=e284]: "0"
          - button "↓" [ref=e285] [cursor=pointer]
          - button "Show Comments" [ref=e286] [cursor=pointer]
          - button "Report" [ref=e288] [cursor=pointer]
      - generic [ref=e289]:
        - generic [ref=e290]:
          - heading "d" [level=3] [ref=e291]
          - generic [ref=e293]: "Time remaining: Closed"
        - paragraph [ref=e294]: f
        - generic [ref=e295]:
          - generic [ref=e296]: "g: 50.0%"
          - generic [ref=e297]: "g: 50.0%"
        - generic [ref=e298]:
          - generic [ref=e299]: 50.0%
          - generic [ref=e300]: 50.0%
        - generic [ref=e301]:
          - button "↑" [ref=e302] [cursor=pointer]
          - generic [ref=e303]: "0"
          - button "↓" [ref=e304] [cursor=pointer]
          - button "Show Comments" [ref=e305] [cursor=pointer]
          - button "Report" [ref=e307] [cursor=pointer]
      - generic [ref=e308]:
        - generic [ref=e309]:
          - heading "d" [level=3] [ref=e310]
          - generic [ref=e312]: "Time remaining: Closed"
        - paragraph [ref=e313]: d
        - generic [ref=e314]:
          - generic [ref=e315]: "d: 50.0%"
          - generic [ref=e316]: "d: 50.0%"
        - generic [ref=e317]:
          - generic [ref=e318]: 50.0%
          - generic [ref=e319]: 50.0%
        - generic [ref=e320]:
          - button "↑" [ref=e321] [cursor=pointer]
          - generic [ref=e322]: "0"
          - button "↓" [ref=e323] [cursor=pointer]
          - button "Show Comments" [ref=e324] [cursor=pointer]
          - button "Report" [ref=e326] [cursor=pointer]
      - generic [ref=e327]:
        - generic [ref=e328]:
          - heading "b" [level=3] [ref=e329]
          - generic [ref=e331]: "Time remaining: Closed"
        - paragraph [ref=e332]: v
        - generic [ref=e333]:
          - generic [ref=e334]: "f: 66.7%"
          - generic [ref=e335]: "n: 33.3%"
        - generic [ref=e336]:
          - generic [ref=e337]: 66.7%
          - generic [ref=e338]: 33.3%
        - generic [ref=e339]:
          - button "↑" [ref=e340] [cursor=pointer]
          - generic [ref=e341]: "0"
          - button "↓" [ref=e342] [cursor=pointer]
          - button "Show Comments" [ref=e343] [cursor=pointer]
          - button "Report" [ref=e345] [cursor=pointer]
      - generic [ref=e346]:
        - generic [ref=e347]:
          - heading "a" [level=3] [ref=e348]
          - generic [ref=e350]: "Time remaining: Closed"
        - paragraph [ref=e351]: b
        - generic [ref=e352]:
          - generic [ref=e353]: "c: 50.0%"
          - generic [ref=e354]: "d: 50.0%"
        - generic [ref=e355]:
          - generic [ref=e356]: 50.0%
          - generic [ref=e357]: 50.0%
        - generic [ref=e358]:
          - button "↑" [ref=e359] [cursor=pointer]
          - generic [ref=e360]: "0"
          - button "↓" [ref=e361] [cursor=pointer]
          - button "Show Comments" [ref=e362] [cursor=pointer]
          - button "Report" [ref=e364] [cursor=pointer]
      - generic [ref=e365]:
        - generic [ref=e366]:
          - heading "a" [level=3] [ref=e367]
          - generic [ref=e369]: "Time remaining: Closed"
        - paragraph [ref=e370]: Q
        - generic [ref=e371]:
          - generic [ref=e372]: "4: 22.2%"
          - generic [ref=e373]: "W: 77.8%"
        - generic [ref=e374]:
          - generic [ref=e375]: 22.2%
          - generic [ref=e376]: 77.8%
        - generic [ref=e377]:
          - button "↑" [ref=e378] [cursor=pointer]
          - generic [ref=e379]: "0"
          - button "↓" [ref=e380] [cursor=pointer]
          - button "Show Comments" [ref=e381] [cursor=pointer]
          - button "Report" [ref=e383] [cursor=pointer]
    - generic [ref=e384]:
      - generic [ref=e386]:
        - heading "Leaderboard" [level=2] [ref=e387]
        - generic [ref=e388]:
          - generic [ref=e389]: 1. example1
          - generic [ref=e390]: 2460 acorns
        - generic [ref=e391]:
          - generic [ref=e392]: 2. example3
          - generic [ref=e393]: 1190 acorns
        - generic [ref=e394]:
          - generic [ref=e395]: 3. 3
          - generic [ref=e396]: 1000 acorns
        - generic [ref=e397]:
          - generic [ref=e398]: 4. 6
          - generic [ref=e399]: 1000 acorns
        - generic [ref=e400]:
          - generic [ref=e401]: 5. dsf
          - generic [ref=e402]: 1000 acorns
        - generic [ref=e403]:
          - generic [ref=e404]: 6. q
          - generic [ref=e405]: 1000 acorns
        - generic [ref=e406]:
          - generic [ref=e407]: 7. sam
          - generic [ref=e408]: 1000 acorns
        - generic [ref=e409]:
          - generic [ref=e410]: 8. sam2
          - generic [ref=e411]: 1000 acorns
        - generic [ref=e412]:
          - generic [ref=e413]: 9. sambb
          - generic [ref=e414]: 1000 acorns
        - generic [ref=e415]:
          - generic [ref=e416]: 10. example2
          - generic [ref=e417]: 590 acorns
      - generic [ref=e419]:
        - heading "Top Bets" [level=2] [ref=e420]
        - generic [ref=e421]:
          - generic [ref=e422]: "123"
          - generic [ref=e423]: "Pool: 60 acorns"
          - generic [ref=e424]: "213214: 40 | 324: 20"
        - generic [ref=e425]:
          - generic [ref=e426]: a
          - generic [ref=e427]: "Pool: 54 acorns"
          - generic [ref=e428]: "4: 12 | W: 42"
        - generic [ref=e429]:
          - generic [ref=e430]: testing closing
          - generic [ref=e431]: "Pool: 14 acorns"
          - generic [ref=e432]: "close: 10 | still close: 4"
        - generic [ref=e433]:
          - generic [ref=e434]: will it rain at the Grinnellian
          - generic [ref=e435]: "Pool: 13 acorns"
          - generic [ref=e436]: "No: 11 | Yes: 2"
        - generic [ref=e437]:
          - generic [ref=e438]: Will Sam backflip
          - generic [ref=e439]: "Pool: 11 acorns"
          - generic [ref=e440]: "No: 1 | Yes: 10"
  - generic [ref=e444]:
    - button "×" [ref=e446] [cursor=pointer]
    - heading "Sign up to gamble today!" [level=2] [ref=e447]
    - generic [ref=e448]:
      - textbox "Username" [ref=e449]: newuser
      - textbox "Email" [ref=e450]: new@test.com
      - textbox "Password" [active] [ref=e451]: short
      - button "Sign up" [ref=e452] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Login modal', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('/');
  6  |     await page.getByRole('button', { name: 'Login' }).click();
  7  |   });
  8  | 
  9  |   test('opens when Login button is clicked', async ({ page }) => {
  10 |     await expect(page.getByText('Welcome back!')).toBeVisible();
  11 |   });
  12 | 
  13 |   test('closes when × button is clicked', async ({ page }) => {
  14 |     await page.getByRole('button', { name: '×' }).click();
  15 |     await expect(page.getByText('Welcome back!')).not.toBeVisible();
  16 |   });
  17 | 
  18 |   test('shows validation errors on empty submit', async ({ page }) => {
  19 |     await page.getByRole('button', { name: 'Log in' }).click();
  20 |     await expect(page.getByText('*Email* is mandatory')).toBeVisible();
  21 |     await expect(page.getByText('*Password* is mandatory')).toBeVisible();
  22 |   });
  23 | 
  24 |   test('shows error message on bad credentials', async ({ page }) => {
  25 |     // Mock the API to return a 401
  26 |     await page.route('/api/auth/login', route =>
  27 |       route.fulfill({ status: 401, body: JSON.stringify({ error: 'Invalid credentials' }) })
  28 |     );
  29 | 
  30 |     await page.getByPlaceholder('Email').fill('bad@example.com');
  31 |     await page.getByPlaceholder('Password').fill('wrongpass');
  32 |     await page.getByRole('button', { name: 'Log in' }).click();
  33 | 
  34 |     await expect(page.getByText('Invalid credentials')).toBeVisible();
  35 |   });
  36 | 
  37 |   test('closes and shows username on successful login', async ({ page }) => {
  38 |     await page.route('/api/auth/login', route =>
  39 |       route.fulfill({
  40 |         status: 200,
  41 |         body: JSON.stringify({
  42 |           token: 'fake-token',
  43 |           user: { id: '1', username: 'testuser', email: 'test@test.com', balance: 500, created_at: '' },
  44 |         }),
  45 |       })
  46 |     );
  47 |     // /api/auth/me is called after login to refresh user
  48 |     await page.route('/api/auth/me', route =>
  49 |       route.fulfill({
  50 |         status: 200,
  51 |         body: JSON.stringify({
  52 |           user: { id: '1', username: 'testuser', email: 'test@test.com', balance: 500, created_at: '' },
  53 |         }),
  54 |       })
  55 |     );
  56 | 
  57 |     await page.getByPlaceholder('Email').fill('test@test.com');
  58 |     await page.getByPlaceholder('Password').fill('password123');
  59 |     await page.getByRole('button', { name: 'Log in' }).click();
  60 | 
  61 |     await expect(page.getByRole('button', { name: /Log Out \(testuser\)/ })).toBeVisible();
  62 |   });
  63 | });
  64 | 
  65 | test.describe('Registration modal', () => {
  66 |   test.beforeEach(async ({ page }) => {
  67 |     await page.goto('/');
  68 |     await page.getByRole('button', { name: 'Sign up' }).click();
  69 |   });
  70 | 
  71 |   test('opens when Sign up button is clicked', async ({ page }) => {
  72 |     await expect(page.getByText('Sign up to gamble today!')).toBeVisible();
  73 |   });
  74 | 
  75 |   test('validates password minimum length', async ({ page }) => {
  76 |     await page.getByPlaceholder('Username').fill('newuser');
  77 |     await page.getByPlaceholder('Email').fill('new@test.com');
  78 |     await page.getByPlaceholder('Password').fill('short');
> 79 |     await page.getByRole('button', { name: 'Sign up' }).click();
     |                                                         ^ Error: locator.click: Error: strict mode violation: getByRole('button', { name: 'Sign up' }) resolved to 2 elements:
  80 | 
  81 |     await expect(page.getByText('*Password* must be at least 8 characters')).toBeVisible();
  82 |   });
  83 | });
```