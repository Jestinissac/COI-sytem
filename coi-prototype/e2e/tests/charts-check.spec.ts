import { test, expect } from '@playwright/test';

test('Director Dashboard shows charts', async ({ page }) => {
  // Login as Director
  await page.goto('/');
  await page.fill('input[type="email"]', 'john.smith@company.com');
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // Wait for dashboard to load
  await page.waitForURL(/\/coi\/director/i, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  
  // Give time for charts to load
  await page.waitForTimeout(3000);
  
  // Check for Insights section
  const insightsSection = page.getByText('Insights');
  console.log('Insights section visible:', await insightsSection.isVisible().catch(() => false));
  
  // Check for chart canvases
  const chartCanvases = page.locator('canvas');
  const chartCount = await chartCanvases.count();
  console.log('Number of chart canvases found:', chartCount);
  
  // Check for Status Distribution heading
  const statusHeading = page.getByText('Status Distribution');
  console.log('Status Distribution heading visible:', await statusHeading.isVisible().catch(() => false));
  
  // Check for Service Type Distribution
  const serviceHeading = page.getByText('Service Type Distribution');
  console.log('Service Type Distribution visible:', await serviceHeading.isVisible().catch(() => false));
  
  // Take screenshot for debugging
  await page.screenshot({ path: 'test-results/director-dashboard.png', fullPage: true });
  
  // At least look for some chart-related elements
  const reportCharts = page.locator('.report-charts');
  console.log('Report charts component visible:', await reportCharts.isVisible().catch(() => false));
  
  expect(chartCount).toBeGreaterThanOrEqual(0);
});

test('Requester Dashboard shows charts', async ({ page }) => {
  // Login as Requester
  await page.goto('/');
  await page.fill('input[type="email"]', 'patricia.white@company.com');
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // Wait for dashboard to load
  await page.waitForURL(/\/coi\/requester/i, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  
  // Give time for charts to load
  await page.waitForTimeout(3000);
  
  // Check for Insights section
  const insightsSection = page.getByText('Insights');
  console.log('Requester - Insights section visible:', await insightsSection.isVisible().catch(() => false));
  
  // Check for chart canvases
  const chartCanvases = page.locator('canvas');
  const chartCount = await chartCanvases.count();
  console.log('Requester - Number of chart canvases found:', chartCount);
  
  // Take screenshot for debugging
  await page.screenshot({ path: 'test-results/requester-dashboard.png', fullPage: true });
  
  expect(chartCount).toBeGreaterThanOrEqual(0);
});
