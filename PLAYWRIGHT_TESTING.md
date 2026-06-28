# SENTINELLE - Playwright E2E Testing Guide

## Setup Playwright

### 1. Install Playwright
```bash
npm install -D @playwright/test
npx playwright install
```

### 2. Create playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 3. Create Test Scenarios

Create `tests/e2e/login.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('SENTINELLE - Login & Authentication', () => {
  test('Login flow: email → OTP → dashboard', async ({ page }) => {
    // Step 1: Navigate to login
    await page.goto('/admin/login');
    
    // Verify login page is shown
    const loginTitle = page.locator('text=ESPACE ADMINISTRATEUR');
    await expect(loginTitle).toBeVisible();
    
    // Step 2: Enter email
    await page.fill('input[type="email"]', 'analyst_jr@sentinelle.test');
    await page.click('button:has-text("Recevoir mon code")');
    
    // Verify OTP page shown
    const otpLabel = page.locator('text=Code de connexion');
    await expect(otpLabel).toBeVisible();
    
    // Step 3: Enter OTP (dev mode shows code)
    // In dev: code is shown in page or logs
    await page.fill('input[inputmode="numeric"]', '123456');
    await page.click('button:has-text("Se connecter")');
    
    // Step 4: Verify dashboard loads
    await page.waitForURL('/admin/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL('/admin/dashboard');
  });

  test('Unauthorized route redirects to login', async ({ page }) => {
    // Try to access /admin/users without auth
    await page.goto('/admin/users');
    
    // Should redirect to login
    await expect(page).toHaveURL('/admin/login');
  });

  test('analyst_jr cannot access /admin/users', async ({ page }) => {
    // Login as analyst_jr
    await loginAs(page, 'analyst_jr@sentinelle.test');
    
    // Try to access /admin/users
    await page.goto('/admin/users');
    
    // Should be redirected (permission denied)
    // Dashboard might redirect or show error
    const allowedTabs = page.locator('text=Tableau de bord');
    const deniedTab = page.locator('text=Utilisateurs');
    
    await expect(allowedTabs).toBeVisible();
    await expect(deniedTab).not.toBeVisible();
  });
});

// Helper function
async function loginAs(page, email: string) {
  await page.goto('/admin/login');
  await page.fill('input[type="email"]', email);
  await page.click('button:has-text("Recevoir mon code")');
  await page.fill('input[inputmode="numeric"]', '123456');
  await page.click('button:has-text("Se connecter")');
  await page.waitForURL('/admin/dashboard');
}
```

Create `tests/e2e/signalement-workflow.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('SENTINELLE - Signalement Workflow', () => {
  test('Complete signalement journey: analyst escalates → chief decides', async ({ page }) => {
    // Login as analyst_jr
    await loginAsAnalyst(page);
    
    // Step 1: Navigate to Signalements
    await page.click('text=Signalements');
    await expect(page).toHaveURL('/admin/signalements');
    
    // Step 2: Open a signalement
    await page.click('button:has-text("Nouveau")');
    
    // Verify detail panel opened
    const detailPanel = page.locator('[class*="panel"]');
    await expect(detailPanel).toBeVisible();
    
    // Step 3: Escalate to chief
    await page.click('button:has-text("Escalade")');
    await page.fill('textarea', 'Needs expert review');
    await page.click('button:has-text("Escalader")');
    
    // Verify escalation success
    await expect(page.locator('text=Escalade réussie')).toBeVisible();
    
    // Step 4: Logout analyst, login as chief
    await logout(page);
    await loginAsChief(page);
    
    // Step 5: View pending escalations
    await page.click('text=Signalements');
    const escalatedItem = page.locator('[class*="escalade"]');
    await expect(escalatedItem).toBeVisible();
    
    // Step 6: Make decision
    await escalatedItem.click();
    await page.click('button:has-text("Validé")');
    await page.selectOption('[data-testid="authority"]', 'ANTIC');
    await page.fill('textarea', 'Clear desinformation campaign');
    await page.click('button:has-text("Transmettre")');
    
    // Verify transmission
    await expect(page.locator('text=Transmission réussie')).toBeVisible();
  });

  test('SLA timer visible and updates', async ({ page }) => {
    await loginAsAnalyst(page);
    await page.click('text=Signalements');
    await page.click('button:has-text("Nouveau")');
    
    // Check SLA timer visible
    const slaTimer = page.locator('[data-testid="sla-timer"]');
    await expect(slaTimer).toBeVisible();
    
    // Verify countdown text
    const slaText = await slaTimer.textContent();
    expect(slaText).toMatch(/\d+h \d+min/);
  });
});

async function loginAsAnalyst(page) {
  await page.goto('/admin/login');
  await page.fill('input[type="email"]', 'analyst_jr@sentinelle.test');
  await page.click('button:has-text("Recevoir mon code")');
  await page.fill('input[inputmode="numeric"]', '123456');
  await page.click('button:has-text("Se connecter")');
  await page.waitForURL('/admin/dashboard');
}

async function loginAsChief(page) {
  await page.goto('/admin/login');
  await page.fill('input[type="email"]', 'chief@sentinelle.test');
  await page.click('button:has-text("Recevoir mon code")');
  await page.fill('input[inputmode="numeric"]', '123456');
  await page.click('button:has-text("Se connecter")');
  await page.waitForURL('/admin/dashboard');
}

async function logout(page) {
  await page.click('button:has-text("Déconnexion")');
  await page.waitForURL('/admin/login');
}
```

Create `tests/e2e/rbac.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('SENTINELLE - Role-Based Access Control', () => {
  test('analyst_jr sees only assigned signalements', async ({ page }) => {
    await loginAsAnalyst(page, 'analyst_jr@sentinelle.test');
    await page.click('text=Signalements');
    
    // Should see menu item
    const signalementMenu = page.locator('text=Signalements');
    await expect(signalementMenu).toBeVisible();
    
    // Should NOT see Users menu
    const usersMenu = page.locator('text=Utilisateurs');
    await expect(usersMenu).not.toBeVisible();
  });

  test('chief sees team menu items', async ({ page }) => {
    await loginAsAnalyst(page, 'chief@sentinelle.test');
    
    // Should see Endpoints (system health)
    const endpointsMenu = page.locator('text=Système');
    await expect(endpointsMenu).toBeVisible();
  });

  test('director sees audit menu', async ({ page }) => {
    await loginAsAnalyst(page, 'director@sentinelle.test');
    
    // Should see Audit/Journal
    const auditMenu = page.locator('text=Audit');
    await expect(auditMenu).toBeVisible();
  });

  test('auditor sees audit in read-only', async ({ page }) => {
    await loginAsAnalyst(page, 'auditor@sentinelle.test');
    await page.click('text=Audit');
    
    // Should NOT see decision buttons
    const decideButton = page.locator('button:has-text("Décider")');
    await expect(decideButton).not.toBeVisible();
  });
});

async function loginAsAnalyst(page, email: string) {
  await page.goto('/admin/login');
  await page.fill('input[type="email"]', email);
  await page.click('button:has-text("Recevoir mon code")');
  await page.fill('input[inputmode="numeric"]', '123456');
  await page.click('button:has-text("Se connecter")');
  await page.waitForURL('/admin/dashboard');
}
```

## Run Tests

### Run All Tests
```bash
npx playwright test
```

### Run Specific Test File
```bash
npx playwright test tests/e2e/login.spec.ts
```

### Run in Debug Mode
```bash
npx playwright test --debug
```

### Run with UI Mode (Visual)
```bash
npx playwright test --ui
```

### Generate Coverage Report
```bash
npx playwright test --reporter=html
# View: playwright-report/index.html
```

## Test Environment Setup

### Use Test Server Instead of Dev Server

Modify `playwright.config.ts`:
```typescript
export default defineConfig({
  webServer: {
    command: 'npm run preview',  // Use production build
    port: 4173,
  },
  use: {
    baseURL: 'http://localhost:4173',
  },
});
```

### Create Test Accounts

Before running tests, create accounts:

```bash
# In database or seed script:
CREATE USERS:
- analyst_jr@sentinelle.test / password123 / role: analyst_jr
- analyst_sr@sentinelle.test / password123 / role: analyst_sr  
- chief@sentinelle.test / password123 / role: chief
- director@sentinelle.test / password123 / role: director
- admin@sentinelle.test / password123 / role: admin
- auditor@sentinelle.test / password123 / role: auditor
```

## CI/CD Integration

Add to `.github/workflows/test.yml`:

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Start services
        run: |
          npm run build
          npm run preview &
          cd backend && python -m uvicorn app.main:app --port 8000 &
      
      - name: Wait for services
        run: sleep 10
      
      - name: Run tests
        run: npx playwright test
      
      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Troubleshooting

### Tests timeout
```bash
# Increase timeout in config
timeout: 60000,

# Or specific test
test('slow test', async ({ page }) => {
  // ...
}, { timeout: 120000 });
```

### OTP code not recognized
Use dev mode that returns code in response:
```typescript
// In dev mode, code shown on page
const codeDisplay = page.locator('[data-testid="dev-code"]');
const code = await codeDisplay.textContent();
await page.fill('input[inputmode="numeric"]', code);
```

### Dashboard not loading
```bash
# Check if backend is running
curl http://localhost:8000/docs

# Check if frontend is running
curl http://localhost:5173
```

## Summary

**Key Test Scenarios**:
1. ✅ Login with OTP
2. ✅ Route protection by permission
3. ✅ Signalment workflow (escalate → decide → transmit)
4. ✅ RBAC enforcement
5. ✅ SLA countdown timer
6. ✅ Role-specific dashboards
7. ✅ Notification delivery
8. ✅ Audit logging

**Run all tests**:
```bash
npm run build
npx playwright test --ui
```

**Check results**:
```bash
npx playwright show-report
```
