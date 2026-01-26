import { test } from '@playwright/test'

test('Capture Director and Reports', async ({ page }) => {
  // Director - john.smith@company.com is a Director
  await page.goto('http://localhost:5173/coi/login')
  await page.fill('input[type="email"]', 'john.smith@company.com')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/director**', { timeout: 15000 })
  await page.waitForTimeout(2000)
  await page.screenshot({ path: 'test-results/director-dashboard.png', fullPage: true })
  
  // Go to Reports
  await page.click('text=Reports')
  await page.waitForTimeout(3000)
  await page.screenshot({ path: 'test-results/reports-page.png', fullPage: true })
})

test('Capture Partner Dashboard', async ({ page }) => {
  // Partner - robert.taylor@company.com
  await page.goto('http://localhost:5173/coi/login')
  await page.fill('input[type="email"]', 'robert.taylor@company.com')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/partner**', { timeout: 15000 })
  await page.waitForTimeout(2000)
  await page.screenshot({ path: 'test-results/partner-dashboard.png', fullPage: true })
  
  // Group Services tab
  const groupTab = page.locator('button:has-text("Group Services")')
  if (await groupTab.isVisible()) {
    await groupTab.click()
    await page.waitForTimeout(1500)
    await page.screenshot({ path: 'test-results/partner-group-services.png', fullPage: true })
  }
  
  // COI Decisions tab
  const coiTab = page.locator('button:has-text("COI Decisions")')
  if (await coiTab.isVisible()) {
    await coiTab.click()
    await page.waitForTimeout(1500)
    await page.screenshot({ path: 'test-results/partner-coi-decisions.png', fullPage: true })
  }
})

test('Capture Requester Dashboard', async ({ page }) => {
  // Requester - patricia.white@company.com
  await page.goto('http://localhost:5173/coi/login')
  await page.fill('input[type="email"]', 'patricia.white@company.com')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/requester**', { timeout: 15000 })
  await page.waitForTimeout(2000)
  await page.screenshot({ path: 'test-results/requester-dashboard.png', fullPage: true })
  
  // Pending tab
  const pendingTab = page.locator('button:has-text("Pending")')
  if (await pendingTab.isVisible()) {
    await pendingTab.click()
    await page.waitForTimeout(1500)
    await page.screenshot({ path: 'test-results/requester-pending.png', fullPage: true })
  }
})
