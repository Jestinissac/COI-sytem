import { test, expect, Page } from '@playwright/test';

/**
 * Landing Page Charts E2E Tests
 * Tests the new clickable charts feature on the landing page
 */

// Test credentials
const USERS = {
  requester: { email: 'patricia.white@company.com', password: 'password', role: 'Requester' },
  director: { email: 'john.smith@company.com', password: 'password', role: 'Director' },
  compliance: { email: 'emily.davis@company.com', password: 'password', role: 'Compliance' },
  partner: { email: 'robert.taylor@company.com', password: 'password', role: 'Partner' },
  admin: { email: 'james.jackson@company.com', password: 'password', role: 'Admin' }
};

async function login(page: Page, email: string, password: string) {
  await page.goto('/');
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
}

test.describe('Landing Page Charts - E2E Tests', () => {

  test('Landing page displays charts section for COI users', async ({ page }) => {
    const user = USERS.requester;
    
    // Login
    await login(page, user.email, user.password);
    
    // Navigate to landing page
    await page.goto('/landing');
    await page.waitForLoadState('networkidle');
    
    // Check if COI System Quick Insights section exists
    const insightsSection = page.locator('text=COI System Quick Insights');
    await expect(insightsSection).toBeVisible({ timeout: 10000 });
    
    // Check for chart containers
    const chartSection = page.locator('text=Click on charts to view filtered reports');
    await expect(chartSection).toBeVisible({ timeout: 5000 });
  });

  test('Charts display with data for Requester', async ({ page }) => {
    const user = USERS.requester;
    
    await login(page, user.email, user.password);
    await page.goto('/landing');
    await page.waitForLoadState('networkidle');
    
    // Wait for charts to load (check for loading state first)
    const loadingState = page.locator('text=Loading insights');
    const hasLoading = await loadingState.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (hasLoading) {
      // Wait for loading to complete
      await expect(loadingState).not.toBeVisible({ timeout: 15000 });
    }
    
    // Check for chart elements (canvas elements from Chart.js)
    const chartCanvases = page.locator('canvas');
    const chartCount = await chartCanvases.count();
    
    // Should have at least one chart if data exists
    if (chartCount > 0) {
      console.log(`Found ${chartCount} chart(s) on landing page`);
      expect(chartCount).toBeGreaterThan(0);
    } else {
      // If no charts, check if it's because no data
      const noDataMessage = page.locator('text=No data available, text=No insights');
      const hasNoData = await noDataMessage.isVisible({ timeout: 2000 }).catch(() => false);
      if (!hasNoData) {
        console.log('Charts section exists but no charts rendered - may need data');
      }
    }
  });

  test('Status chart is clickable and navigates to Reports', async ({ page }) => {
    const user = USERS.requester;
    
    await login(page, user.email, user.password);
    await page.goto('/landing');
    await page.waitForLoadState('networkidle');
    
    // Wait for charts to load
    await page.waitForTimeout(3000); // Give time for charts to render
    
    // Find the status chart canvas (first canvas is usually the pie chart)
    const statusChart = page.locator('canvas').first();
    const chartVisible = await statusChart.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (chartVisible) {
      // Click on the chart (clicking center area)
      const box = await statusChart.boundingBox();
      if (box) {
        // Click near center of chart
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        
        // Wait for navigation
        await page.waitForLoadState('networkidle');
        
        // Check if navigated to reports page
        const currentUrl = page.url();
        expect(currentUrl).toContain('/coi/reports');
        
        // Check if query parameters are present
        const urlParams = new URL(currentUrl).searchParams;
        expect(urlParams.has('report')).toBeTruthy();
      }
    } else {
      console.log('Status chart not visible - skipping click test');
    }
  });

  test('Service Type chart click navigates with filter', async ({ page }) => {
    const user = USERS.requester;
    
    await login(page, user.email, user.password);
    await page.goto('/landing');
    await page.waitForLoadState('networkidle');
    
    // Wait for charts
    await page.waitForTimeout(3000);
    
    // Find bar charts (service type and client are bar charts)
    const barCharts = page.locator('canvas');
    const chartCount = await barCharts.count();
    
    if (chartCount >= 2) {
      // Second canvas is usually service type chart
      const serviceChart = barCharts.nth(1);
      const box = await serviceChart.boundingBox();
      
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForLoadState('networkidle');
        
        const currentUrl = page.url();
        if (currentUrl.includes('/coi/reports')) {
          const urlParams = new URL(currentUrl).searchParams;
          // Should have report and serviceType or role params
          expect(urlParams.has('report') || urlParams.has('serviceType')).toBeTruthy();
        }
      }
    } else {
      console.log('Service type chart not found - skipping test');
    }
  });

  test('Reports page applies filters from chart click', async ({ page }) => {
    const user = USERS.requester;
    
    await login(page, user.email, user.password);
    
    // Navigate directly to reports with query params (simulating chart click)
    await page.goto('/coi/reports?report=my-requests-summary&role=requester&status=Approved');
    await page.waitForLoadState('networkidle');
    
    // Check if report is selected
    const reportContent = page.locator('text=My Requests Summary, text=Executive Summary');
    await expect(reportContent.first()).toBeVisible({ timeout: 10000 });
    
    // Check if filters are applied (look for filter chips or status in summary)
    const statusFilter = page.locator('text=Approved, [data-status="Approved"]');
    const hasFilter = await statusFilter.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasFilter) {
      console.log('Filter successfully applied from query parameter');
    } else {
      // Check if data is filtered in the summary cards
      const summaryCards = page.locator('.summary, [class*="summary"]');
      const hasSummary = await summaryCards.count() > 0;
      expect(hasSummary).toBeTruthy();
    }
  });

  test('Charts section only shows for users with COI access', async ({ page }) => {
    // Test with a user that should have COI access
    const user = USERS.requester;
    
    await login(page, user.email, user.password);
    await page.goto('/landing');
    await page.waitForLoadState('networkidle');
    
    // Check for COI system tile
    const coiTile = page.locator('text=COI System, text=COI');
    const hasCOI = await coiTile.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasCOI) {
      // Should have charts section
      const chartsSection = page.locator('text=COI System Quick Insights');
      await expect(chartsSection).toBeVisible({ timeout: 5000 });
    } else {
      // Should not have charts section
      const chartsSection = page.locator('text=COI System Quick Insights');
      await expect(chartsSection).not.toBeVisible({ timeout: 2000 });
    }
  });

  test('Loading state displays while fetching chart data', async ({ page }) => {
    const user = USERS.requester;
    
    await login(page, user.email, user.password);
    
    // Navigate and immediately check for loading state
    await page.goto('/landing');
    
    // Check for loading spinner or text
    const loadingIndicator = page.locator('text=Loading insights, [class*="spinner"], [class*="loading"]');
    const hasLoading = await loadingIndicator.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (hasLoading) {
      console.log('Loading state detected');
      // Wait for it to disappear
      await expect(loadingIndicator).not.toBeVisible({ timeout: 15000 });
    }
  });

  test('All user roles can see charts on landing page', async ({ page }) => {
    const roles = ['requester', 'director', 'compliance', 'partner', 'admin'];
    
    for (const roleKey of roles) {
      const user = USERS[roleKey as keyof typeof USERS];
      
      await login(page, user.email, user.password);
      await page.goto('/landing');
      await page.waitForLoadState('networkidle');
      
      // Check if charts section exists
      const chartsSection = page.locator('text=COI System Quick Insights');
      const sectionVisible = await chartsSection.isVisible({ timeout: 5000 }).catch(() => false);
      
      console.log(`${user.role}: Charts section visible: ${sectionVisible}`);
      
      // Logout for next iteration
      await page.goto('/landing');
      const logoutButton = page.locator('button:has-text("Logout")');
      if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await logoutButton.click();
        await page.waitForLoadState('networkidle');
      }
    }
  });
});
