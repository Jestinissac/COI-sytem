import { test, expect } from '@playwright/test'

// Test credentials - sarah.johnson is a Director (has access to CRM tab)
const DIRECTOR_USER = {
  email: 'sarah.johnson@company.com',
  password: 'password123',
  role: 'Director'
}

// Helper function to login
async function login(page: any, email: string, password: string) {
  await page.goto('http://localhost:5173/login')
  await page.waitForLoadState('networkidle')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  // Wait for redirect to dashboard
  await page.waitForURL(/\/(coi|dashboard)/, { timeout: 15000 })
}

test.describe('CRM UX Improvements - Tabbed UI', () => {
  test('Director Dashboard should have CRM tab with divider', async ({ page }) => {
    await login(page, DIRECTOR_USER.email, DIRECTOR_USER.password)
    
    // Navigate to dashboard
    await page.goto('http://localhost:5173/coi/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Check for CRM tab in sidebar
    const crmTab = page.locator('button:has-text("CRM")')
    await expect(crmTab).toBeVisible({ timeout: 10000 })
    
    // Click on CRM tab
    await crmTab.click()
    await page.waitForTimeout(500)
    
    // Verify CRM Insights section is visible
    const crmInsights = page.locator('text=CRM Insights')
    await expect(crmInsights).toBeVisible()
    
    // Verify quick action links are present
    const prospectLink = page.locator('text=Prospect Management')
    await expect(prospectLink).toBeVisible()
    
    const reportsLink = page.locator('text=CRM Reports')
    await expect(reportsLink).toBeVisible()
  })

  test('Overview tab should NOT have embedded CRM section', async ({ page }) => {
    await login(page, DIRECTOR_USER.email, DIRECTOR_USER.password)
    
    // Navigate to dashboard
    await page.goto('http://localhost:5173/coi/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Ensure we're on Overview tab
    const overviewTab = page.locator('button:has-text("Overview")')
    await overviewTab.click()
    await page.waitForTimeout(500)
    
    // The Overview tab should NOT have "Track prospects and sales pipeline" text
    // (that's the CRM Insights subtitle that was removed)
    const crmSubtitle = page.locator('text=Track prospects and sales pipeline performance')
    // Should not be visible in Overview - it should only be in CRM tab
    const isVisible = await crmSubtitle.isVisible().catch(() => false)
    
    // If CRM section is visible, it should be in the CRM tab, not Overview
    if (isVisible) {
      // Check if CRM tab is active
      const crmTabActive = await page.locator('button:has-text("CRM")').getAttribute('aria-selected')
      expect(crmTabActive).toBe('true')
    }
  })
})

test.describe('CRM UX Improvements - Smart Suggest', () => {
  test('COI Request Form should have Smart Suggest dropdown', async ({ page }) => {
    await login(page, DIRECTOR_USER.email, DIRECTOR_USER.password)
    
    // Navigate to new request form
    await page.goto('http://localhost:5173/coi/request/new')
    await page.waitForLoadState('networkidle')
    
    // Find the client/prospect dropdown
    const dropdown = page.locator('select').filter({ hasText: 'Search or select' }).first()
    await expect(dropdown).toBeVisible({ timeout: 10000 })
    
    // Check for PRMS Clients optgroup
    const prmsGroup = page.locator('optgroup[label="PRMS Clients"]')
    await expect(prmsGroup).toBeVisible()
    
    // Check for Create New option
    const newGroup = page.locator('optgroup[label="New"]')
    await expect(newGroup).toBeVisible()
    
    const createOption = page.locator('option:has-text("+ Create New Prospect")')
    await expect(createOption).toBeVisible()
  })

  test('Clicking Create New Prospect should open modal', async ({ page }) => {
    await login(page, DIRECTOR_USER.email, DIRECTOR_USER.password)
    
    // Navigate to new request form
    await page.goto('http://localhost:5173/coi/request/new')
    await page.waitForLoadState('networkidle')
    
    // Find and interact with the dropdown
    const dropdown = page.locator('select').filter({ hasText: 'Search or select' }).first()
    await expect(dropdown).toBeVisible({ timeout: 10000 })
    await dropdown.selectOption('new:prospect')
    
    // Modal should appear
    const modal = page.locator('text=Create New Prospect')
    await expect(modal).toBeVisible()
    
    // Check modal has required fields
    const nameInput = page.locator('input[placeholder="Enter prospect name"]')
    await expect(nameInput).toBeVisible()
    
    const industrySelect = page.locator('select').filter({ hasText: 'Select industry' })
    await expect(industrySelect).toBeVisible()
    
    // Check for Create & Select button
    const createButton = page.locator('button:has-text("Create & Select")')
    await expect(createButton).toBeVisible()
    
    // Close modal
    const cancelButton = page.locator('button:has-text("Cancel")')
    await cancelButton.click()
  })
})
