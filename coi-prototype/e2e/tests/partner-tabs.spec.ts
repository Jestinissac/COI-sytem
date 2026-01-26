import { test } from '@playwright/test'

test('Partner Dashboard All Tabs', async ({ page }) => {
  await page.goto('http://localhost:5173/coi/login')
  await page.fill('input[type="email"]', 'robert.taylor@company.com')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/partner**', { timeout: 15000 })
  await page.waitForTimeout(2000)
  
  // Overview
  await page.screenshot({ path: 'test-results/partner-01-overview.png', fullPage: true })
  
  // Pending Approval
  await page.getByText('Pending Approval').first().click()
  await page.waitForTimeout(1500)
  await page.screenshot({ path: 'test-results/partner-02-pending.png', fullPage: true })
  
  // COI Decisions
  await page.getByText('COI Decisions').first().click()
  await page.waitForTimeout(1500)
  await page.screenshot({ path: 'test-results/partner-03-coi-decisions.png', fullPage: true })
  
  // Engagement Letters
  await page.getByText('Engagement Letters').first().click()
  await page.waitForTimeout(1500)
  await page.screenshot({ path: 'test-results/partner-04-engagement-letters.png', fullPage: true })
  
  // Group Services
  await page.getByText('Group Services').first().click()
  await page.waitForTimeout(1500)
  await page.screenshot({ path: 'test-results/partner-05-group-services.png', fullPage: true })
})
