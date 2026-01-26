import { test, expect } from '@playwright/test';

/**
 * Partner Dashboard - Enterprise Filters E2E Test
 * Tests COI Decisions and Engagement Letters tabs
 */

test.describe('Partner Dashboard - Enterprise Filters', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as Partner
    await page.goto('/');
    await page.fill('input[type="email"]', 'robert.taylor@company.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/coi\/partner/i, { timeout: 15000 });
  });

  test('should display COI Decisions with filters', async ({ page }) => {
    // Navigate to COI Decisions tab
    await page.click('text=COI Decisions');
    await page.waitForTimeout(1000);

    // Take screenshot
    await page.screenshot({ path: 'test-results/coi-decisions-tab.png', fullPage: true });

    // Verify filters
    const searchInput = page.locator('input[placeholder="Search client or request..."]');
    expect(await searchInput.isVisible()).toBe(true);

    const decisionFilter = page.locator('select').filter({ hasText: 'All Decisions' });
    expect(await decisionFilter.isVisible()).toBe(true);

    const serviceFilter = page.locator('select').filter({ hasText: 'All Services' });
    expect(await serviceFilter.isVisible()).toBe(true);

    // Verify summary stats
    const totalDecisions = page.locator('text=Total Decisions');
    expect(await totalDecisions.isVisible()).toBe(true);

    console.log('COI Decisions tab with filters verified!');
  });

  test('should filter COI Decisions by restrictions', async ({ page }) => {
    await page.click('text=COI Decisions');
    await page.waitForTimeout(1000);

    // Check the "With restrictions" checkbox
    const restrictionsCheckbox = page.locator('text=With restrictions');
    await restrictionsCheckbox.click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'test-results/coi-decisions-restrictions.png', fullPage: true });

    console.log('Restrictions filter applied!');
  });

  test('should display Engagement Letters with filters', async ({ page }) => {
    // Navigate to Engagement Letters tab
    await page.click('text=Engagement Letters');
    await page.waitForTimeout(1000);

    // Take screenshot
    await page.screenshot({ path: 'test-results/engagement-letters-tab.png', fullPage: true });

    // Verify filters
    const searchInput = page.locator('input[placeholder="Search client or request..."]');
    expect(await searchInput.isVisible()).toBe(true);

    const statusFilter = page.locator('select').filter({ hasText: 'All Status' });
    expect(await statusFilter.isVisible()).toBe(true);

    // Verify summary stats
    const awaitingResponse = page.locator('text=Awaiting Response');
    expect(await awaitingResponse.isVisible()).toBe(true);

    console.log('Engagement Letters tab with filters verified!');
  });

  test('should filter Engagement Letters by urgent', async ({ page }) => {
    await page.click('text=Engagement Letters');
    await page.waitForTimeout(1000);

    // Check the "Urgent only" checkbox
    const urgentCheckbox = page.locator('text=Urgent only');
    await urgentCheckbox.click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'test-results/engagement-letters-urgent.png', fullPage: true });

    console.log('Urgent filter applied!');
  });

  test('should search across COI Decisions', async ({ page }) => {
    await page.click('text=COI Decisions');
    await page.waitForTimeout(1000);

    // Search for "ABC"
    const searchInput = page.locator('input[placeholder="Search client or request..."]');
    await searchInput.fill('ABC');
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'test-results/coi-decisions-search.png', fullPage: true });

    // Verify ABC results shown
    const abcResult = page.locator('text=ABC').first();
    expect(await abcResult.isVisible()).toBe(true);

    console.log('Search filter verified!');
  });
});
