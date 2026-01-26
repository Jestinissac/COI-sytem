import { test } from '@playwright/test';

/**
 * Partner Dashboard - All Tabs Screenshots
 * Captures screenshots of all enterprise filter tabs
 */

test('capture all Partner Dashboard tabs', async ({ page }) => {
  // Login as Partner
  await page.goto('/');
  await page.fill('input[type="email"]', 'robert.taylor@company.com');
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/coi\/partner/i, { timeout: 15000 });
  await page.waitForTimeout(1000);

  // Overview
  await page.screenshot({ path: 'test-results/tabs/01-overview.png', fullPage: true });

  // Pending Approval
  await page.click('text=Pending Approval');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/tabs/02-pending-approval.png', fullPage: true });

  // COI Decisions
  await page.click('text=COI Decisions');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/tabs/03-coi-decisions.png', fullPage: true });

  // Engagement Letters
  await page.click('text=Engagement Letters');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/tabs/04-engagement-letters.png', fullPage: true });

  // Red Flags
  await page.click('text=Red Flags');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/tabs/05-red-flags.png', fullPage: true });

  // Group Services
  await page.click('text=Group Services');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/tabs/06-group-services.png', fullPage: true });

  // 3-Year Renewals
  await page.click('text=3-Year Renewals');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/tabs/07-renewals.png', fullPage: true });

  console.log('All tabs captured!');
});
