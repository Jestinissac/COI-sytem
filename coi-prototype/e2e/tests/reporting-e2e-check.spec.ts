import { test, expect } from '@playwright/test'

/**
 * E2E Test: Reporting Module and Recent Changes Verification
 * Tests the reporting functionality and verifies recent UI/UX improvements
 */

test.describe('COI System - Reporting Module E2E Check', () => {
  
  test('Login and verify Reports page with charts and filters', async ({ page }) => {
    // Navigate to login
    await page.goto('http://localhost:5173/coi/login')
    await page.waitForLoadState('networkidle')
    
    // Take screenshot of login page
    await page.screenshot({ path: 'test-results/01-login-page.png', fullPage: true })
    
    // Login as Director (has access to reports)
    await page.fill('input[type="email"]', 'emily.davis@company.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Wait for dashboard
    await page.waitForURL('**/director**', { timeout: 10000 })
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'test-results/02-director-dashboard.png', fullPage: true })
    
    // Navigate to Reports
    await page.click('text=Reports')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // Wait for charts to render
    
    // Take screenshot of Reports page
    await page.screenshot({ path: 'test-results/03-reports-page.png', fullPage: true })
    
    // Check for charts
    const chartElements = await page.locator('canvas, .chart, [class*="chart"]').count()
    console.log(`Found ${chartElements} chart elements`)
    
    // Check for filter controls
    const filterSection = page.locator('[class*="filter"], [class*="Filter"]').first()
    if (await filterSection.isVisible()) {
      console.log('Filter section found')
    }
    
    // Check for date range filters
    const dateInputs = await page.locator('input[type="date"]').count()
    console.log(`Found ${dateInputs} date inputs`)
    
    // Check for export button
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")')
    if (await exportButton.first().isVisible()) {
      console.log('Export button found')
    }
    
    // Scroll down to see more content
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2))
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'test-results/04-reports-scrolled.png', fullPage: true })
  })

  test('Check Director Dashboard with Days Pending column', async ({ page }) => {
    // Login as Director
    await page.goto('http://localhost:5173/coi/login')
    await page.fill('input[type="email"]', 'emily.davis@company.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/director**', { timeout: 10000 })
    await page.waitForLoadState('networkidle')
    
    // Check for Days Pending column in Pending Approval tab
    const daysPendingHeader = page.locator('th:has-text("Days Pending")')
    if (await daysPendingHeader.isVisible()) {
      console.log('Days Pending column found in Director Dashboard')
      await page.screenshot({ path: 'test-results/05-director-days-pending.png', fullPage: true })
    }
    
    // Check for enterprise filters
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first()
    if (await searchInput.isVisible()) {
      console.log('Search filter found')
    }
    
    // Check for filter dropdowns
    const filterDropdowns = await page.locator('select').count()
    console.log(`Found ${filterDropdowns} filter dropdowns`)
  })

  test('Check Requester Dashboard with enterprise filters', async ({ page }) => {
    // Login as Requester
    await page.goto('http://localhost:5173/coi/login')
    await page.fill('input[type="email"]', 'john.smith@company.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/requester**', { timeout: 10000 })
    await page.waitForLoadState('networkidle')
    
    await page.screenshot({ path: 'test-results/06-requester-dashboard.png', fullPage: true })
    
    // Check for enterprise filter pattern
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first()
    const hasSearch = await searchInput.isVisible()
    console.log(`Requester Dashboard has search: ${hasSearch}`)
    
    // Check for summary statistics
    const summaryStats = page.locator('[class*="summary"], [class*="stat"], .bg-blue-50, .bg-green-50')
    const statsCount = await summaryStats.count()
    console.log(`Found ${statsCount} summary stat elements`)
    
    // Navigate to Pending tab if available
    const pendingTab = page.locator('button:has-text("Pending"), [role="tab"]:has-text("Pending")')
    if (await pendingTab.first().isVisible()) {
      await pendingTab.first().click()
      await page.waitForTimeout(1000)
      await page.screenshot({ path: 'test-results/07-requester-pending-tab.png', fullPage: true })
      
      // Check for Days Pending column
      const daysPendingHeader = page.locator('th:has-text("Days Pending")')
      if (await daysPendingHeader.isVisible()) {
        console.log('Days Pending column found in Requester Pending tab')
      }
    }
  })

  test('Check Partner Dashboard with Group Services filters', async ({ page }) => {
    // Login as Partner
    await page.goto('http://localhost:5173/coi/login')
    await page.fill('input[type="email"]', 'robert.taylor@company.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/partner**', { timeout: 10000 })
    await page.waitForLoadState('networkidle')
    
    await page.screenshot({ path: 'test-results/08-partner-dashboard.png', fullPage: true })
    
    // Navigate to Group Services tab
    const groupServicesTab = page.locator('button:has-text("Group Services"), [role="tab"]:has-text("Group Services")')
    if (await groupServicesTab.first().isVisible()) {
      await groupServicesTab.first().click()
      await page.waitForTimeout(1000)
      await page.screenshot({ path: 'test-results/09-partner-group-services.png', fullPage: true })
      
      // Check for enterprise filter pattern
      const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]')
      const hasSearch = await searchInput.first().isVisible()
      console.log(`Group Services has search: ${hasSearch}`)
      
      // Check for filter dropdowns
      const filterDropdowns = await page.locator('select').count()
      console.log(`Group Services has ${filterDropdowns} filter dropdowns`)
    }
    
    // Check COI Decisions tab
    const coiDecisionsTab = page.locator('button:has-text("COI Decisions"), [role="tab"]:has-text("COI Decisions")')
    if (await coiDecisionsTab.first().isVisible()) {
      await coiDecisionsTab.first().click()
      await page.waitForTimeout(1000)
      await page.screenshot({ path: 'test-results/10-partner-coi-decisions.png', fullPage: true })
    }
  })

  test('Check Compliance Dashboard with filters', async ({ page }) => {
    // Login as Compliance
    await page.goto('http://localhost:5173/coi/login')
    await page.fill('input[type="email"]', 'sarah.johnson@company.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/compliance**', { timeout: 10000 })
    await page.waitForLoadState('networkidle')
    
    await page.screenshot({ path: 'test-results/11-compliance-dashboard.png', fullPage: true })
    
    // Check for enterprise filter pattern
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first()
    const hasSearch = await searchInput.isVisible()
    console.log(`Compliance Dashboard has search: ${hasSearch}`)
    
    // Check for filter dropdowns
    const filterDropdowns = await page.locator('select').count()
    console.log(`Compliance Dashboard has ${filterDropdowns} filter dropdowns`)
  })

  test('Check Finance Dashboard with filters', async ({ page }) => {
    // Login as Finance
    await page.goto('http://localhost:5173/coi/login')
    await page.fill('input[type="email"]', 'david.wilson@company.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/finance**', { timeout: 10000 })
    await page.waitForLoadState('networkidle')
    
    await page.screenshot({ path: 'test-results/12-finance-dashboard.png', fullPage: true })
    
    // Check for enterprise filter pattern
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first()
    const hasSearch = await searchInput.isVisible()
    console.log(`Finance Dashboard has search: ${hasSearch}`)
  })

  test('Check International Operations form with Affiliate option', async ({ page }) => {
    // Login as Requester
    await page.goto('http://localhost:5173/coi/login')
    await page.fill('input[type="email"]', 'john.smith@company.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/requester**', { timeout: 10000 })
    await page.waitForLoadState('networkidle')
    
    // Click New Request
    const newRequestBtn = page.locator('button:has-text("New Request"), a:has-text("New Request")')
    if (await newRequestBtn.first().isVisible()) {
      await newRequestBtn.first().click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
      
      await page.screenshot({ path: 'test-results/13-new-request-form.png', fullPage: true })
      
      // Look for International Operations section
      const intlOpsSection = page.locator('text=International Operations, text=Global COI')
      if (await intlOpsSection.first().isVisible()) {
        console.log('International Operations section found')
        
        // Check for Affiliate option in relationship dropdown
        const relationshipSelect = page.locator('select').filter({ hasText: /relationship/i })
        if (await relationshipSelect.first().isVisible()) {
          const options = await relationshipSelect.first().locator('option').allTextContents()
          const hasAffiliate = options.some(opt => opt.toLowerCase().includes('affiliate'))
          console.log(`Has Affiliate option: ${hasAffiliate}`)
        }
      }
    }
  })
})
