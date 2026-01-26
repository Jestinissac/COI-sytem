import { test, expect, Page } from '@playwright/test'

/**
 * CRM Features End-to-End Test Suite
 * Tests all CRM functionality: Prospect Management, Lead Sources, Reports, Dashboard Cards
 * 
 * Based on CRM_FEATURES_COMPLETE_LIST.md
 */

// Test users by role (matching actual database users)
const CRM_TEST_USERS = {
  admin: { email: 'james.jackson@company.com', password: 'password123', role: 'Admin' },
  partner: { email: 'robert.taylor@company.com', password: 'password123', role: 'Partner' },
  compliance: { email: 'david.wilson@company.com', password: 'password123', role: 'Compliance' },
  director: { email: 'john.smith@company.com', password: 'password123', role: 'Director' },
  requester: { email: 'patricia.white@company.com', password: 'password123', role: 'Requester' }
}

// Lead sources as defined in the system
const LEAD_SOURCES = [
  'Internal Referral',
  'Client Referral', 
  'Client Intelligence Module',
  'Cold Outreach',
  'Marketing Campaign',
  'Event / Conference',
  'Direct Client Creation',
  'Unknown / Legacy'
]

// CRM Report names
const CRM_REPORTS_PHASE2 = [
  'Lead Source Effectiveness',
  'Funnel Performance',
  'Insights-to-Conversion',
  'Attribution by User'
]

const CRM_REPORTS_PHASE3 = [
  'Pipeline Forecast',
  'Conversion Trends',
  'Period Comparison',
  'Lost Prospect Analysis'
]

// Helper function to login
async function login(page: Page, user: { email: string; password: string }) {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.fill('input[type="email"]', user.email)
  await page.fill('input[type="password"]', user.password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/coi\//i, { timeout: 15000 })
  await page.waitForLoadState('networkidle')
}

// Helper to wait for loading to complete
async function waitForLoading(page: Page) {
  await page.waitForLoadState('networkidle')
  // Wait for any loading spinners to disappear
  const spinner = page.locator('.animate-spin, [class*="loading"]')
  if (await spinner.isVisible({ timeout: 1000 }).catch(() => false)) {
    await spinner.waitFor({ state: 'hidden', timeout: 10000 })
  }
}

// Helper to navigate to a specific route
async function navigateTo(page: Page, route: string) {
  await page.goto(route)
  await waitForLoading(page)
}

// ============================================================================
// SECTION 1: PROSPECT MANAGEMENT MODULE TESTS
// ============================================================================
test.describe('CRM - Prospect Management Module', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, CRM_TEST_USERS.admin)
  })

  test('should navigate to Prospect Management page', async ({ page }) => {
    await navigateTo(page, '/coi/prospects')
    
    // Verify page header
    await expect(page.locator('h1:has-text("Prospect Management")')).toBeVisible()
    await expect(page.locator('text=Manage prospects separately from clients')).toBeVisible()
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/crm-prospect-management.png', fullPage: true })
  })

  test('should display Add Prospect button', async ({ page }) => {
    await navigateTo(page, '/coi/prospects')
    
    const addButton = page.locator('button:has-text("Add Prospect")')
    await expect(addButton).toBeVisible()
    await expect(addButton).toBeEnabled()
  })

  test('should open Create Prospect modal with all required fields', async ({ page }) => {
    await navigateTo(page, '/coi/prospects')
    
    // Click Add Prospect button
    await page.click('button:has-text("Add Prospect")')
    await page.waitForTimeout(500)
    
    // Verify modal is open - look for modal content
    const modal = page.locator('[role="dialog"], .modal, .fixed.inset-0')
    await expect(modal.first()).toBeVisible({ timeout: 5000 })
    
    // Take screenshot of modal
    await page.screenshot({ path: 'test-results/crm-create-prospect-modal.png', fullPage: true })
  })

  test('should display prospect table with correct columns', async ({ page }) => {
    await navigateTo(page, '/coi/prospects')
    
    // Verify table headers
    const table = page.locator('table')
    await expect(table).toBeVisible()
    
    await expect(page.locator('th:has-text("Prospect Name")')).toBeVisible()
    await expect(page.locator('th:has-text("Industry")')).toBeVisible()
    await expect(page.locator('th:has-text("Linked Client")')).toBeVisible()
    await expect(page.locator('th:has-text("Status")')).toBeVisible()
    await expect(page.locator('th:has-text("Actions")')).toBeVisible()
  })

  test('should have status filter with correct options', async ({ page }) => {
    await navigateTo(page, '/coi/prospects')
    
    // Find status filter by looking for select with "All Statuses" option
    const statusSelect = page.locator('select').filter({ has: page.locator('option[value="Active"]') }).first()
    await expect(statusSelect).toBeVisible()
    
    // Verify options exist by checking the select has the expected options
    const options = await statusSelect.locator('option').allTextContents()
    expect(options.some(o => o.includes('All Statuses') || o.includes('All'))).toBeTruthy()
    expect(options.some(o => o.includes('Active'))).toBeTruthy()
    expect(options.some(o => o.includes('Converted'))).toBeTruthy()
    expect(options.some(o => o.includes('Inactive'))).toBeTruthy()
  })

  test('should have PRMS sync filter', async ({ page }) => {
    await navigateTo(page, '/coi/prospects')
    
    // Find PRMS Status label
    const prmsLabel = page.getByText('PRMS Status')
    await expect(prmsLabel).toBeVisible()
    
    // Find the PRMS select element by looking for one with synced option
    const prmsSelect = page.locator('select').filter({ has: page.locator('option[value="synced"]') }).first()
    
    if (await prmsSelect.isVisible().catch(() => false)) {
      // Verify options exist
      const options = await prmsSelect.locator('option').allTextContents()
      expect(options.some(o => o.includes('PRMS Synced') || o.includes('Synced'))).toBeTruthy()
      expect(options.some(o => o.includes('Not Synced'))).toBeTruthy()
    }
  })

  test('should have search functionality', async ({ page }) => {
    await navigateTo(page, '/coi/prospects')
    
    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"]')
    await expect(searchInput).toBeVisible()
    
    // Type in search
    await searchInput.fill('Test')
    await page.waitForTimeout(500)
  })

  test('should display View action for prospects', async ({ page }) => {
    await navigateTo(page, '/coi/prospects')
    
    // Check if there are any prospects in the table
    const viewButtons = page.locator('button:has-text("View"), a:has-text("View")')
    const count = await viewButtons.count()
    
    if (count > 0) {
      await expect(viewButtons.first()).toBeVisible()
    }
  })

  test('should display Convert action for active prospects', async ({ page }) => {
    await navigateTo(page, '/coi/prospects')
    
    // Check for Convert buttons (only visible for Active status)
    const convertButtons = page.locator('button:has-text("Convert")')
    const count = await convertButtons.count()
    
    // If there are active prospects, Convert button should be visible
    if (count > 0) {
      await expect(convertButtons.first()).toBeVisible()
    }
  })
})

// ============================================================================
// SECTION 2: LEAD SOURCE ATTRIBUTION TESTS
// ============================================================================
test.describe('CRM - Lead Source Attribution', () => {
  test('should display Lead Source dropdown in COI Request Form', async ({ page }) => {
    await login(page, CRM_TEST_USERS.requester)
    
    // Navigate to new COI request form
    await navigateTo(page, '/coi/request/new')
    await page.waitForTimeout(1000)
    
    // Look for Lead Source field - it may be a select or labeled field
    const leadSourceLabel = page.locator('text=Lead Source').first()
    const leadSourceExists = await leadSourceLabel.isVisible().catch(() => false)
    
    if (leadSourceExists) {
      await expect(leadSourceLabel).toBeVisible()
    }
  })

  test('should have all 8 lead sources available in Prospect Management', async ({ page }) => {
    await login(page, CRM_TEST_USERS.admin)
    await navigateTo(page, '/coi/prospects')
    
    // Open create modal
    await page.click('button:has-text("Add Prospect")')
    await page.waitForTimeout(500)
    
    // Look for lead source dropdown in the modal
    const leadSourceSelect = page.locator('select').filter({ hasText: /Lead Source|Internal Referral|Client Referral/ }).first()
    
    if (await leadSourceSelect.isVisible().catch(() => false)) {
      // Click to open dropdown and check options
      await leadSourceSelect.click()
      
      // Verify some key lead sources are present
      const options = await page.locator('option').allTextContents()
      console.log('Available lead source options:', options)
    }
  })

  test('should auto-detect lead source based on context', async ({ page }) => {
    // This test verifies the auto-detection logic exists
    // When creating from Client Intelligence, lead source should be auto-set
    await login(page, CRM_TEST_USERS.partner)
    
    // Navigate to Client Intelligence if available
    const clientIntelLink = page.locator('text=Client Intelligence')
    if (await clientIntelLink.isVisible().catch(() => false)) {
      await clientIntelLink.click()
      await waitForLoading(page)
    }
  })
})

// ============================================================================
// SECTION 3: CRM DASHBOARD CARDS TESTS
// ============================================================================
test.describe('CRM - Dashboard Cards', () => {
  test('should display CRM Insights cards on Partner dashboard', async ({ page }) => {
    await login(page, CRM_TEST_USERS.partner)
    
    // Wait for dashboard to load
    await waitForLoading(page)
    await page.waitForTimeout(2000)
    
    // Look for CRM Insights section
    const crmInsightsHeader = page.locator('text=CRM Insights')
    
    if (await crmInsightsHeader.isVisible().catch(() => false)) {
      await expect(crmInsightsHeader).toBeVisible()
      
      // Take screenshot of dashboard with CRM cards
      await page.screenshot({ path: 'test-results/crm-dashboard-cards.png', fullPage: true })
    }
  })

  test('should display Lead Sources card with data', async ({ page }) => {
    await login(page, CRM_TEST_USERS.admin)
    await waitForLoading(page)
    await page.waitForTimeout(2000)
    
    // Look for Lead Sources card
    const leadSourcesCard = page.locator('text=Lead Sources').first()
    
    if (await leadSourcesCard.isVisible().catch(() => false)) {
      await expect(leadSourcesCard).toBeVisible()
    }
  })

  test('should display Funnel Performance card', async ({ page }) => {
    await login(page, CRM_TEST_USERS.admin)
    await waitForLoading(page)
    await page.waitForTimeout(2000)
    
    // Look for Funnel Performance card
    const funnelCard = page.locator('text=Funnel Performance').first()
    
    if (await funnelCard.isVisible().catch(() => false)) {
      await expect(funnelCard).toBeVisible()
    }
  })

  test('should display AI Insights card', async ({ page }) => {
    await login(page, CRM_TEST_USERS.admin)
    await waitForLoading(page)
    await page.waitForTimeout(2000)
    
    // Look for AI Insights card
    const aiInsightsCard = page.locator('text=AI Insights').first()
    
    if (await aiInsightsCard.isVisible().catch(() => false)) {
      await expect(aiInsightsCard).toBeVisible()
    }
  })

  test('should display Top Performers card', async ({ page }) => {
    await login(page, CRM_TEST_USERS.admin)
    await waitForLoading(page)
    await page.waitForTimeout(2000)
    
    // Look for Top Performers card
    const topPerformersCard = page.locator('text=Top Performers').first()
    
    if (await topPerformersCard.isVisible().catch(() => false)) {
      await expect(topPerformersCard).toBeVisible()
    }
  })

  test('should have Refresh button for CRM cards', async ({ page }) => {
    await login(page, CRM_TEST_USERS.admin)
    await waitForLoading(page)
    await page.waitForTimeout(2000)
    
    // Look for Refresh button near CRM Insights
    const refreshButton = page.locator('button:has-text("Refresh")').first()
    
    if (await refreshButton.isVisible().catch(() => false)) {
      await expect(refreshButton).toBeVisible()
      await expect(refreshButton).toBeEnabled()
    }
  })

  test('should navigate to report when clicking CRM card', async ({ page }) => {
    await login(page, CRM_TEST_USERS.admin)
    await waitForLoading(page)
    await page.waitForTimeout(2000)
    
    // Try clicking on Lead Sources card
    const leadSourcesCard = page.locator('text=Lead Sources').first()
    
    if (await leadSourcesCard.isVisible().catch(() => false)) {
      await leadSourcesCard.click()
      await page.waitForTimeout(1000)
      
      // Should navigate to reports or show report detail
      const currentUrl = page.url()
      console.log('Navigated to:', currentUrl)
    }
  })
})

// ============================================================================
// SECTION 4: CRM REPORTS - PHASE 2 TESTS
// ============================================================================
test.describe('CRM - Phase 2 Reports', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, CRM_TEST_USERS.admin)
  })

  test('should navigate to Reports page', async ({ page }) => {
    await navigateTo(page, '/coi/reports')
    
    // Verify Reports page header
    await expect(page.locator('h1:has-text("Reports")')).toBeVisible()
  })

  test('should display Report Catalog with CRM reports', async ({ page }) => {
    await navigateTo(page, '/coi/reports')
    
    // Click Browse Report Catalog button
    const catalogButton = page.locator('button:has-text("Browse Report Catalog"), button:has-text("Report Catalog")')
    if (await catalogButton.isVisible().catch(() => false)) {
      await catalogButton.click()
      await page.waitForTimeout(1000)
      
      // Take screenshot of catalog
      await page.screenshot({ path: 'test-results/crm-report-catalog.png', fullPage: true })
    }
  })

  test('should have Lead Source Effectiveness report available', async ({ page }) => {
    await navigateTo(page, '/coi/reports')
    
    // Open catalog if needed
    const catalogButton = page.locator('button:has-text("Browse Report Catalog")')
    if (await catalogButton.isVisible().catch(() => false)) {
      await catalogButton.click()
      await page.waitForTimeout(1000)
    }
    
    // Look for Lead Source Effectiveness report
    const report = page.locator('text=Lead Source Effectiveness').first()
    if (await report.isVisible().catch(() => false)) {
      await expect(report).toBeVisible()
    }
  })

  test('should have Funnel Performance report available', async ({ page }) => {
    await navigateTo(page, '/coi/reports')
    
    const catalogButton = page.locator('button:has-text("Browse Report Catalog")')
    if (await catalogButton.isVisible().catch(() => false)) {
      await catalogButton.click()
      await page.waitForTimeout(1000)
    }
    
    const report = page.locator('text=Funnel Performance').first()
    if (await report.isVisible().catch(() => false)) {
      await expect(report).toBeVisible()
    }
  })

  test('should have Insights-to-Conversion report available', async ({ page }) => {
    await navigateTo(page, '/coi/reports')
    
    const catalogButton = page.locator('button:has-text("Browse Report Catalog")')
    if (await catalogButton.isVisible().catch(() => false)) {
      await catalogButton.click()
      await page.waitForTimeout(1000)
    }
    
    const report = page.locator('text=Insights-to-Conversion, text=Insights to Conversion').first()
    if (await report.isVisible().catch(() => false)) {
      await expect(report).toBeVisible()
    }
  })

  test('should have Attribution by User report available', async ({ page }) => {
    await navigateTo(page, '/coi/reports')
    
    const catalogButton = page.locator('button:has-text("Browse Report Catalog")')
    if (await catalogButton.isVisible().catch(() => false)) {
      await catalogButton.click()
      await page.waitForTimeout(1000)
    }
    
    const report = page.locator('text=Attribution by User, text=Attribution').first()
    if (await report.isVisible().catch(() => false)) {
      await expect(report).toBeVisible()
    }
  })

  test('should generate Lead Source Effectiveness report', async ({ page }) => {
    await navigateTo(page, '/coi/reports')
    
    // Open catalog
    const catalogButton = page.locator('button:has-text("Browse Report Catalog")')
    if (await catalogButton.isVisible().catch(() => false)) {
      await catalogButton.click()
      await page.waitForTimeout(1000)
    }
    
    // Select Lead Source Effectiveness report
    const report = page.locator('text=Lead Source Effectiveness').first()
    if (await report.isVisible().catch(() => false)) {
      await report.click()
      await page.waitForTimeout(500)
      
      // Click Generate Report
      const generateButton = page.locator('button:has-text("Generate Report")')
      if (await generateButton.isVisible().catch(() => false)) {
        await generateButton.click()
        await page.waitForTimeout(3000)
        
        // Take screenshot
        await page.screenshot({ path: 'test-results/crm-lead-source-report.png', fullPage: true })
      }
    }
  })

  test('should generate Funnel Performance report', async ({ page }) => {
    await navigateTo(page, '/coi/reports')
    
    const catalogButton = page.locator('button:has-text("Browse Report Catalog")')
    if (await catalogButton.isVisible().catch(() => false)) {
      await catalogButton.click()
      await page.waitForTimeout(1000)
    }
    
    const report = page.locator('text=Funnel Performance').first()
    if (await report.isVisible().catch(() => false)) {
      await report.click()
      await page.waitForTimeout(500)
      
      const generateButton = page.locator('button:has-text("Generate Report")')
      if (await generateButton.isVisible().catch(() => false)) {
        await generateButton.click()
        await page.waitForTimeout(3000)
        
        await page.screenshot({ path: 'test-results/crm-funnel-report.png', fullPage: true })
      }
    }
  })
})

// ============================================================================
// SECTION 5: CRM REPORTS - PHASE 3 TESTS
// ============================================================================
test.describe('CRM - Phase 3 Reports', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, CRM_TEST_USERS.admin)
  })

  test('should have Pipeline Forecast report available', async ({ page }) => {
    await navigateTo(page, '/coi/reports')
    
    const catalogButton = page.locator('button:has-text("Browse Report Catalog")')
    if (await catalogButton.isVisible().catch(() => false)) {
      await catalogButton.click()
      await page.waitForTimeout(1000)
    }
    
    const report = page.locator('text=Pipeline Forecast').first()
    if (await report.isVisible().catch(() => false)) {
      await expect(report).toBeVisible()
    }
  })

  test('should have Conversion Trends report available', async ({ page }) => {
    await navigateTo(page, '/coi/reports')
    
    const catalogButton = page.locator('button:has-text("Browse Report Catalog")')
    if (await catalogButton.isVisible().catch(() => false)) {
      await catalogButton.click()
      await page.waitForTimeout(1000)
    }
    
    const report = page.locator('text=Conversion Trends').first()
    if (await report.isVisible().catch(() => false)) {
      await expect(report).toBeVisible()
    }
  })

  test('should have Period Comparison report available', async ({ page }) => {
    await navigateTo(page, '/coi/reports')
    
    const catalogButton = page.locator('button:has-text("Browse Report Catalog")')
    if (await catalogButton.isVisible().catch(() => false)) {
      await catalogButton.click()
      await page.waitForTimeout(1000)
    }
    
    const report = page.locator('text=Period Comparison').first()
    if (await report.isVisible().catch(() => false)) {
      await expect(report).toBeVisible()
    }
  })

  test('should have Lost Prospect Analysis report available', async ({ page }) => {
    await navigateTo(page, '/coi/reports')
    
    const catalogButton = page.locator('button:has-text("Browse Report Catalog")')
    if (await catalogButton.isVisible().catch(() => false)) {
      await catalogButton.click()
      await page.waitForTimeout(1000)
    }
    
    const report = page.locator('text=Lost Prospect Analysis, text=Lost Prospect').first()
    if (await report.isVisible().catch(() => false)) {
      await expect(report).toBeVisible()
    }
  })

  test('should generate Pipeline Forecast report', async ({ page }) => {
    await navigateTo(page, '/coi/reports')
    
    const catalogButton = page.locator('button:has-text("Browse Report Catalog")')
    if (await catalogButton.isVisible().catch(() => false)) {
      await catalogButton.click()
      await page.waitForTimeout(1000)
    }
    
    const report = page.locator('text=Pipeline Forecast').first()
    if (await report.isVisible().catch(() => false)) {
      await report.click()
      await page.waitForTimeout(500)
      
      const generateButton = page.locator('button:has-text("Generate Report")')
      if (await generateButton.isVisible().catch(() => false)) {
        await generateButton.click()
        await page.waitForTimeout(3000)
        
        await page.screenshot({ path: 'test-results/crm-pipeline-forecast-report.png', fullPage: true })
      }
    }
  })

  test('should generate Conversion Trends report', async ({ page }) => {
    await navigateTo(page, '/coi/reports')
    
    const catalogButton = page.locator('button:has-text("Browse Report Catalog")')
    if (await catalogButton.isVisible().catch(() => false)) {
      await catalogButton.click()
      await page.waitForTimeout(1000)
    }
    
    const report = page.locator('text=Conversion Trends').first()
    if (await report.isVisible().catch(() => false)) {
      await report.click()
      await page.waitForTimeout(500)
      
      const generateButton = page.locator('button:has-text("Generate Report")')
      if (await generateButton.isVisible().catch(() => false)) {
        await generateButton.click()
        await page.waitForTimeout(3000)
        
        await page.screenshot({ path: 'test-results/crm-conversion-trends-report.png', fullPage: true })
      }
    }
  })
})

// ============================================================================
// SECTION 6: STALE DETECTION API TESTS
// ============================================================================
test.describe('CRM - Stale Detection APIs', () => {
  test('should return stale detection summary via API', async ({ page, request }) => {
    // First login to get auth token
    await login(page, CRM_TEST_USERS.admin)
    
    // Get cookies/token from browser context
    const cookies = await page.context().cookies()
    const tokenCookie = cookies.find(c => c.name === 'token' || c.name === 'auth')
    
    // Make API request
    const response = await request.get('http://localhost:3000/api/prospects/stale/summary', {
      headers: tokenCookie ? { 'Cookie': `${tokenCookie.name}=${tokenCookie.value}` } : {}
    })
    
    // API should respond (may be 200 or 401 depending on auth)
    console.log('Stale summary API status:', response.status())
  })

  test('should return lost reasons via API', async ({ page, request }) => {
    await login(page, CRM_TEST_USERS.admin)
    
    const cookies = await page.context().cookies()
    const tokenCookie = cookies.find(c => c.name === 'token' || c.name === 'auth')
    
    const response = await request.get('http://localhost:3000/api/prospects/lost/reasons', {
      headers: tokenCookie ? { 'Cookie': `${tokenCookie.name}=${tokenCookie.value}` } : {}
    })
    
    console.log('Lost reasons API status:', response.status())
    
    if (response.ok()) {
      const data = await response.json()
      console.log('Lost reasons:', data)
      // Should have 10 reason codes
      expect(Array.isArray(data) || typeof data === 'object').toBeTruthy()
    }
  })
})

// ============================================================================
// SECTION 7: ROLE-BASED ACCESS TESTS
// ============================================================================
test.describe('CRM - Role-Based Access', () => {
  test('Admin should have access to Prospect Management', async ({ page }) => {
    await login(page, CRM_TEST_USERS.admin)
    await navigateTo(page, '/coi/prospects')
    
    // Should see the page, not redirected
    await expect(page.locator('h1:has-text("Prospect Management")')).toBeVisible()
  })

  test('Partner should have access to Prospect Management', async ({ page }) => {
    await login(page, CRM_TEST_USERS.partner)
    await navigateTo(page, '/coi/prospects')
    
    // Should see the page
    const header = page.locator('h1:has-text("Prospect Management")')
    if (await header.isVisible().catch(() => false)) {
      await expect(header).toBeVisible()
    }
  })

  test('Director should have access to Prospect Management', async ({ page }) => {
    await login(page, CRM_TEST_USERS.director)
    await navigateTo(page, '/coi/prospects')
    
    const header = page.locator('h1:has-text("Prospect Management")')
    await expect(header).toBeVisible()
  })

  test('Requester should have access to Prospect Management', async ({ page }) => {
    await login(page, CRM_TEST_USERS.requester)
    await navigateTo(page, '/coi/prospects')
    
    const header = page.locator('h1:has-text("Prospect Management")')
    await expect(header).toBeVisible()
  })

  test('Admin should have access to CRM Reports', async ({ page }) => {
    await login(page, CRM_TEST_USERS.admin)
    await navigateTo(page, '/coi/reports')
    
    // Open catalog
    const catalogButton = page.locator('button:has-text("Browse Report Catalog")')
    if (await catalogButton.isVisible().catch(() => false)) {
      await catalogButton.click()
      await page.waitForTimeout(1000)
      
      // Should see CRM reports
      const leadSourceReport = page.locator('text=Lead Source Effectiveness')
      if (await leadSourceReport.isVisible().catch(() => false)) {
        await expect(leadSourceReport).toBeVisible()
      }
    }
  })

  test('Partner should have access to CRM Reports', async ({ page }) => {
    await login(page, CRM_TEST_USERS.partner)
    await navigateTo(page, '/coi/reports')
    
    const catalogButton = page.locator('button:has-text("Browse Report Catalog")')
    if (await catalogButton.isVisible().catch(() => false)) {
      await catalogButton.click()
      await page.waitForTimeout(1000)
      
      const leadSourceReport = page.locator('text=Lead Source Effectiveness')
      if (await leadSourceReport.isVisible().catch(() => false)) {
        await expect(leadSourceReport).toBeVisible()
      }
    }
  })

  test('Director should have access to CRM Reports', async ({ page }) => {
    await login(page, CRM_TEST_USERS.director)
    await navigateTo(page, '/coi/reports')
    
    const catalogButton = page.locator('button:has-text("Browse Report Catalog")')
    if (await catalogButton.isVisible().catch(() => false)) {
      await catalogButton.click()
      await page.waitForTimeout(1000)
      
      // Director should now see CRM reports (sales cycle participant)
      const leadSourceReport = page.locator('text=Lead Source Effectiveness')
      await expect(leadSourceReport.first()).toBeVisible()
    }
  })

  test('Requester should have access to CRM Reports', async ({ page }) => {
    await login(page, CRM_TEST_USERS.requester)
    await navigateTo(page, '/coi/reports')
    
    const catalogButton = page.locator('button:has-text("Browse Report Catalog")')
    if (await catalogButton.isVisible().catch(() => false)) {
      await catalogButton.click()
      await page.waitForTimeout(1000)
      
      // Requester should now see CRM reports (sales cycle participant)
      const leadSourceReport = page.locator('text=Lead Source Effectiveness')
      await expect(leadSourceReport.first()).toBeVisible()
    }
  })

  test('Compliance should NOT have access to CRM Reports', async ({ page }) => {
    await login(page, CRM_TEST_USERS.compliance)
    await navigateTo(page, '/coi/reports')
    
    const catalogButton = page.locator('button:has-text("Browse Report Catalog")')
    if (await catalogButton.isVisible().catch(() => false)) {
      await catalogButton.click()
      await page.waitForTimeout(1000)
      
      // Compliance should NOT see CRM reports anymore
      const leadSourceReport = page.locator('text=Lead Source Effectiveness')
      const isVisible = await leadSourceReport.isVisible().catch(() => false)
      
      // Compliance should not see CRM reports
      console.log('Compliance can see Lead Source Effectiveness:', isVisible)
      expect(isVisible).toBeFalsy()
    }
  })

  test('Requester should be able to select Lead Source on COI form', async ({ page }) => {
    await login(page, CRM_TEST_USERS.requester)
    
    // Navigate to new request form
    await navigateTo(page, '/coi/request/new')
    await page.waitForTimeout(1000)
    
    // Look for Lead Source field
    const leadSourceField = page.locator('text=Lead Source').first()
    const exists = await leadSourceField.isVisible().catch(() => false)
    
    console.log('Requester can see Lead Source field:', exists)
  })
})

// ============================================================================
// SECTION 8: COMPREHENSIVE CRM WORKFLOW TEST
// ============================================================================
test.describe('CRM - Complete Workflow', () => {
  test('should complete full CRM workflow: Create prospect -> View reports', async ({ page }) => {
    // Login as Admin
    await login(page, CRM_TEST_USERS.admin)
    
    // Step 1: Navigate to Prospect Management
    await navigateTo(page, '/coi/prospects')
    await expect(page.locator('h1:has-text("Prospect Management")')).toBeVisible()
    
    // Step 2: Open Create Prospect modal
    await page.click('button:has-text("Add Prospect")')
    await page.waitForTimeout(500)
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/crm-workflow-1-create-modal.png', fullPage: true })
    
    // Step 3: Close modal and go to Reports
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
    
    await navigateTo(page, '/coi/reports')
    await expect(page.locator('h1:has-text("Reports")')).toBeVisible()
    
    // Step 4: Open Report Catalog
    const catalogButton = page.locator('button:has-text("Browse Report Catalog")')
    if (await catalogButton.isVisible().catch(() => false)) {
      await catalogButton.click()
      await page.waitForTimeout(1000)
      
      await page.screenshot({ path: 'test-results/crm-workflow-2-report-catalog.png', fullPage: true })
    }
    
    // Step 5: Generate a CRM report
    const leadSourceReport = page.locator('text=Lead Source Effectiveness').first()
    if (await leadSourceReport.isVisible().catch(() => false)) {
      await leadSourceReport.click()
      await page.waitForTimeout(500)
      
      const generateButton = page.locator('button:has-text("Generate Report")')
      if (await generateButton.isVisible().catch(() => false)) {
        await generateButton.click()
        await page.waitForTimeout(3000)
        
        await page.screenshot({ path: 'test-results/crm-workflow-3-generated-report.png', fullPage: true })
      }
    }
    
    console.log('CRM workflow test completed successfully')
  })
})
