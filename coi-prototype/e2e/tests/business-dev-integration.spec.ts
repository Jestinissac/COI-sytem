import { test, expect } from '@playwright/test'

// Test user credentials
const TEST_USER = {
  email: 'sarah.johnson@company.com',
  password: 'password123'
}

test.describe('Prospect CRM Tab Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Director (has access to Prospect CRM)
    await page.goto('/login')
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    
    // Wait for dashboard to load
    await page.waitForURL(/\/coi\/director/)
    await page.waitForTimeout(1000)
  })

  test('should display Prospect CRM tab in sidebar', async ({ page }) => {
    // Check that Prospect CRM tab exists
    const bdTab = page.locator('button', { hasText: 'Prospect CRM' })
    await expect(bdTab).toBeVisible()
  })

  test('should show sub-tabs when Prospect CRM is clicked', async ({ page }) => {
    // Click on Prospect CRM tab
    await page.click('button:has-text("Prospect CRM")')
    await page.waitForTimeout(500)

    // Check for sub-tabs
    await expect(page.locator('button:has-text("Prospects")')).toBeVisible()
    await expect(page.locator('button:has-text("Pipeline")')).toBeVisible()
    await expect(page.locator('button:has-text("AI Insights")')).toBeVisible()
    await expect(page.locator('button:has-text("Analytics")')).toBeVisible()
  })

  test('should display Prospects sub-tab content', async ({ page }) => {
    // Navigate to Prospect CRM > Prospects
    await page.click('button:has-text("Prospect CRM")')
    await page.waitForTimeout(500)
    
    // Prospects should be default sub-tab
    await expect(page.locator('h3:has-text("Prospects")')).toBeVisible()
    await expect(page.locator('button:has-text("Add Prospect")')).toBeVisible()
  })

  test('should display Pipeline sub-tab content', async ({ page }) => {
    // Navigate to Prospect CRM > Pipeline
    await page.click('button:has-text("Prospect CRM")')
    await page.waitForTimeout(500)
    await page.click('button:has-text("Pipeline")')
    await page.waitForTimeout(500)

    // Check for Pipeline content
    await expect(page.locator('h3:has-text("Pipeline Overview")')).toBeVisible()
    await expect(page.locator('text=Conversion Rate')).toBeVisible()
  })

  test('should display AI Insights sub-tab content', async ({ page }) => {
    // Navigate to Prospect CRM > AI Insights
    await page.click('button:has-text("Prospect CRM")')
    await page.waitForTimeout(500)
    await page.click('button:has-text("AI Insights")')
    await page.waitForTimeout(500)

    // Check for AI Insights content
    await expect(page.locator('h3:has-text("AI Insights")')).toBeVisible()
    await expect(page.locator('button:has-text("Generate New Insights")')).toBeVisible()
  })

  test('should display Analytics sub-tab content', async ({ page }) => {
    // Navigate to Prospect CRM > Analytics
    await page.click('button:has-text("Prospect CRM")')
    await page.waitForTimeout(500)
    await page.click('button:has-text("Analytics")')
    await page.waitForTimeout(500)

    // Check for Analytics content
    await expect(page.locator('h3:has-text("Analytics")')).toBeVisible()
    await expect(page.locator('text=Lead Source Effectiveness')).toBeVisible()
  })

  test('should NOT show Business Intelligence in top navigation', async ({ page }) => {
    // Check that Business Intelligence tab is NOT in top nav
    const biTab = page.locator('nav a:has-text("Business Intelligence")')
    await expect(biTab).not.toBeVisible()
  })

  test('should redirect /coi/client-intelligence to dashboard', async ({ page }) => {
    // Try to navigate to old client-intelligence route
    await page.goto('/coi/client-intelligence')
    
    // Should redirect to dashboard with business-dev tab
    await page.waitForTimeout(1000)
    const url = page.url()
    expect(url).toContain('/coi/requester')
  })
})

test.describe('Action Dropdown Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/coi\/director/)
    await page.waitForTimeout(1000)
  })

  test('should show action options when Take Action is clicked', async ({ page }) => {
    // Navigate to AI Insights
    await page.click('button:has-text("Prospect CRM")')
    await page.waitForTimeout(500)
    await page.click('button:has-text("AI Insights")')
    await page.waitForTimeout(1000)

    // Check if there are any recommendations with Take Action button
    const takeActionButton = page.locator('button:has-text("Take Action")').first()
    
    if (await takeActionButton.isVisible()) {
      await takeActionButton.click()
      await page.waitForTimeout(500)

      // Check for action options in modal
      await expect(page.locator('text=Create Prospect')).toBeVisible()
      await expect(page.locator('text=Create COI Request')).toBeVisible()
      await expect(page.locator('text=Log Interaction Only')).toBeVisible()
    }
  })
})
