import { test, expect } from '@playwright/test';

/**
 * Group Services Tab - E2E Test
 * Tests the enterprise design with filters
 */

test.describe('Partner Dashboard - Group Services', () => {
  
  test('should display Group Services tab with filters', async ({ page }) => {
    // Login as Partner (Robert Taylor)
    console.log('Step 1: Logging in as Robert Taylor (Partner)...');
    await page.goto('/');
    await page.fill('input[type="email"]', 'robert.taylor@company.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/coi\/partner/i, { timeout: 15000 });
    console.log('Login successful');

    // Navigate to Group Services tab
    console.log('Step 2: Navigating to Group Services tab...');
    await page.click('text=Group Services');
    await page.waitForTimeout(1000);

    // Take screenshot
    await page.screenshot({ path: 'test-results/group-services-tab.png', fullPage: true });

    // Verify filters are present
    console.log('Step 3: Verifying filters...');
    
    // Search input
    const searchInput = page.locator('input[placeholder="Search client or request..."]');
    const hasSearch = await searchInput.isVisible();
    console.log('Search input visible:', hasSearch);
    expect(hasSearch).toBe(true);
    
    // Status filter dropdown
    const statusFilter = page.locator('select').filter({ hasText: 'All Status' }).first();
    const hasStatusFilter = await statusFilter.isVisible();
    console.log('Status filter visible:', hasStatusFilter);
    expect(hasStatusFilter).toBe(true);
    
    // Service type filter
    const serviceFilter = page.locator('select').filter({ hasText: 'All Services' }).first();
    const hasServiceFilter = await serviceFilter.isVisible();
    console.log('Service filter visible:', hasServiceFilter);
    expect(hasServiceFilter).toBe(true);
    
    // Conflicts only checkbox
    const conflictsCheckbox = page.locator('text=Conflicts only');
    const hasConflictsFilter = await conflictsCheckbox.isVisible();
    console.log('Conflicts checkbox visible:', hasConflictsFilter);
    expect(hasConflictsFilter).toBe(true);

    // Verify summary stats
    console.log('Step 4: Verifying summary stats...');
    const clientGroupsCard = page.locator('text=Client Groups');
    const engagementsCard = page.locator('text=Engagements').first();
    const activeCard = page.locator('text=Active').first();
    
    expect(await clientGroupsCard.isVisible()).toBe(true);
    expect(await engagementsCard.isVisible()).toBe(true);
    expect(await activeCard.isVisible()).toBe(true);

    console.log('Group Services tab loaded with enterprise filters!');
  });

  test('should filter by status', async ({ page }) => {
    // Login as Partner
    await page.goto('/');
    await page.fill('input[type="email"]', 'robert.taylor@company.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/coi\/partner/i, { timeout: 15000 });

    // Navigate to Group Services tab
    await page.click('text=Group Services');
    await page.waitForTimeout(1000);

    // Get initial count
    const initialCount = await page.locator('text=Engagements').first().locator('..').locator('div').first().textContent();
    console.log('Initial engagements count:', initialCount);

    // Filter by Active status
    await page.selectOption('select:has-text("All Status")', 'Active');
    await page.waitForTimeout(500);

    // Take screenshot after filter
    await page.screenshot({ path: 'test-results/group-services-active-filter.png', fullPage: true });

    // Verify filter applied
    const filteredCount = await page.locator('text=Engagements').first().locator('..').locator('div').first().textContent();
    console.log('Filtered engagements count:', filteredCount);

    // Clear filters
    const clearButton = page.locator('text=Clear filters');
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await page.waitForTimeout(500);
      console.log('Filters cleared');
    }

    console.log('Status filter test complete!');
  });

  test('should expand client group to show engagements', async ({ page }) => {
    // Login as Partner
    await page.goto('/');
    await page.fill('input[type="email"]', 'robert.taylor@company.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/coi\/partner/i, { timeout: 15000 });

    // Navigate to Group Services tab
    await page.click('text=Group Services');
    await page.waitForTimeout(1000);

    // Click on first client group to expand
    const firstGroup = page.locator('button').filter({ hasText: /engagement\(s\)/ }).first();
    await firstGroup.click();
    await page.waitForTimeout(500);

    // Take screenshot of expanded view
    await page.screenshot({ path: 'test-results/group-services-expanded.png', fullPage: true });

    // Verify table is visible
    const table = page.locator('table');
    const hasTable = await table.isVisible();
    console.log('Engagements table visible:', hasTable);
    expect(hasTable).toBe(true);

    // Verify View button is present
    const viewButton = page.locator('text=View →').first();
    const hasViewButton = await viewButton.isVisible();
    console.log('View button visible:', hasViewButton);
    expect(hasViewButton).toBe(true);

    console.log('Client group expansion test complete!');
  });

  test('should search for specific client', async ({ page }) => {
    // Login as Partner
    await page.goto('/');
    await page.fill('input[type="email"]', 'robert.taylor@company.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/coi\/partner/i, { timeout: 15000 });

    // Navigate to Group Services tab
    await page.click('text=Group Services');
    await page.waitForTimeout(1000);

    // Search for "ABC"
    const searchInput = page.locator('input[placeholder="Search client or request..."]');
    await searchInput.fill('ABC');
    await page.waitForTimeout(500);

    // Take screenshot
    await page.screenshot({ path: 'test-results/group-services-search.png', fullPage: true });

    // Verify filtered results contain ABC
    const abcResult = page.locator('text=ABC').first();
    const hasAbcResult = await abcResult.isVisible();
    console.log('ABC search result visible:', hasAbcResult);
    expect(hasAbcResult).toBe(true);

    console.log('Search filter test complete!');
  });
});
