import { test } from '@playwright/test'

test('Partner Group Services and COI Decisions', async ({ page }) => {
  await page.goto('http://localhost:5173/coi/login')
  await page.fill('input[type="email"]', 'robert.taylor@company.com')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/partner**', { timeout: 15000 })
  await page.waitForTimeout(2000)
  
  // Group Services tab
  const groupTab = page.locator('button:has-text("Group Services")')
  if (await groupTab.isVisible()) {
    await groupTab.click()
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'test-results/partner-group-services-filters.png', fullPage: true })
  }
  
  // COI Decisions tab
  const coiTab = page.locator('button:has-text("COI Decisions")')
  if (await coiTab.isVisible()) {
    await coiTab.click()
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'test-results/partner-coi-decisions-filters.png', fullPage: true })
  }
  
  // Engagement Letters tab
  const engTab = page.locator('button:has-text("Engagement Letters")')
  if (await engTab.isVisible()) {
    await engTab.click()
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'test-results/partner-engagement-letters.png', fullPage: true })
  }
})

test('Compliance Dashboard with filters', async ({ page }) => {
  await page.goto('http://localhost:5173/coi/login')
  await page.fill('input[type="email"]', 'emily.davis@company.com')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/compliance**', { timeout: 15000 })
  await page.waitForTimeout(2000)
  await page.screenshot({ path: 'test-results/compliance-dashboard.png', fullPage: true })
  
  // Pending Review tab
  const pendingTab = page.locator('button:has-text("Pending Review")')
  if (await pendingTab.isVisible()) {
    await pendingTab.click()
    await page.waitForTimeout(1500)
    await page.screenshot({ path: 'test-results/compliance-pending-review.png', fullPage: true })
  }
})

test('Finance Dashboard with filters', async ({ page }) => {
  await page.goto('http://localhost:5173/coi/login')
  await page.fill('input[type="email"]', 'lisa.thomas@company.com')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/finance**', { timeout: 15000 })
  await page.waitForTimeout(2000)
  await page.screenshot({ path: 'test-results/finance-dashboard.png', fullPage: true })
})

test('New Request Form with International Operations', async ({ page }) => {
  await page.goto('http://localhost:5173/coi/login')
  await page.fill('input[type="email"]', 'patricia.white@company.com')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/requester**', { timeout: 15000 })
  await page.waitForTimeout(2000)
  
  // Click New Request
  await page.click('text=New Request')
  await page.waitForTimeout(2000)
  await page.screenshot({ path: 'test-results/new-request-form.png', fullPage: true })
  
  // Scroll down to see more
  await page.evaluate(() => window.scrollTo(0, 1000))
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'test-results/new-request-form-scrolled.png', fullPage: true })
})
