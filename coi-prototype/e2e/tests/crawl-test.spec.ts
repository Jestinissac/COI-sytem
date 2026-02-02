import { test, expect } from '@playwright/test';

/**
 * Crawl test: login, key routes, and Line of Service dropdown.
 * Run: npx playwright test crawl-test.spec.ts
 * Requires: frontend (npm run dev) AND backend (cd backend && npm run dev) running on port 3000.
 */
test.describe('Crawl test', () => {
  test('crawl: login -> dashboard -> New COI Request -> Line of Service loads', async ({ page }) => {
    // 1. Login page
    await page.goto('/');
    await expect(page).toHaveTitle(/COI System/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // 2. Login
    await page.fill('input[type="email"]', 'patricia.white@company.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/coi\//i, { timeout: 15000 });
    await expect(page).not.toHaveURL(/\/login/i);

    // 3. Dashboard: ensure we see some content (list or empty state)
    await page.waitForLoadState('networkidle');
    const onDashboard = page.url().includes('/coi/');
    expect(onDashboard).toBe(true);

    // 4. Go to New COI Request
    await page.goto('/coi/request/new');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/coi\/request\/new/);
    await expect(page.getByRole('heading', { name: /New COI Request/i })).toBeVisible({ timeout: 15000 });

    // 5. Wait for Line of Service dropdown to populate (backend must be running)
    const losSelect = page.locator('#section-4 select').first();
    await expect(page.getByText('Line of Service (local request)')).toBeVisible();
    await expect(losSelect).toBeVisible();
    await page.waitForFunction(
      () => document.querySelector('#section-4 select')?.querySelectorAll('option').length >= 2,
      { timeout: 12000 }
    );
    expect(await losSelect.locator('option').count()).toBeGreaterThanOrEqual(2);
  });
});
