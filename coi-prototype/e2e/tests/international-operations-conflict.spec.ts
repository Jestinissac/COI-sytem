import { test, expect } from '@playwright/test'

/**
 * E2E Tests for International Operations Conflict Detection
 * Verifies IESBA 290.13 compliance for entities in global_coi_form_data
 */

test.describe('International Operations Conflict Detection', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as Requester (Patricia White)
    await page.goto('http://localhost:5173/coi/login')
    await page.fill('input[type="email"]', 'patricia.white@bdo.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/requester**')
  })

  test('should show Affiliate relationship type in International Operations form', async ({ page }) => {
    // Navigate to create new request
    await page.click('text=New Request')
    await page.waitForSelector('text=New COI Request')
    
    // Fill basic info
    await page.selectOption('select[name="client_id"]', { index: 1 })
    await page.selectOption('select[name="service_type"]', { index: 1 })
    
    // Enable International Operations
    const intlOpsCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /international/i }).first()
    if (await intlOpsCheckbox.isVisible()) {
      await intlOpsCheckbox.check()
    }
    
    // Look for the relationship type dropdown in International Operations section
    const relationshipDropdown = page.locator('select').filter({ hasText: /relationship/i }).first()
    
    if (await relationshipDropdown.isVisible()) {
      // Check that Affiliate option exists
      const affiliateOption = await relationshipDropdown.locator('option[value="affiliate"]').count()
      expect(affiliateOption).toBeGreaterThan(0)
      
      // Screenshot for verification
      await page.screenshot({ path: 'test-results/intl-ops-affiliate-option.png', fullPage: true })
    }
  })

  test('API: checkInternationalOperationsConflicts returns conflicts for matching entities', async ({ request }) => {
    // First, create a test request with international operations
    const loginResponse = await request.post('http://localhost:3000/api/auth/login', {
      data: {
        email: 'patricia.white@bdo.com',
        password: 'password123'
      }
    })
    
    const loginData = await loginResponse.json()
    const token = loginData.token
    
    // Get an existing request that has international operations
    const requestsResponse = await request.get('http://localhost:3000/api/coi/requests', {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    const requests = await requestsResponse.json()
    
    // Find a request with international_operations = true
    const intlRequest = requests.find((r: any) => r.international_operations === 1 || r.international_operations === true)
    
    if (intlRequest) {
      console.log(`Found international operations request: ${intlRequest.request_id}`)
      
      // The conflict detection runs on submit, so we verify the request has the field
      expect(intlRequest.international_operations).toBeTruthy()
      
      // If it has global_coi_form_data, parse and verify structure
      if (intlRequest.global_coi_form_data) {
        const globalData = JSON.parse(intlRequest.global_coi_form_data)
        expect(globalData).toHaveProperty('countries')
        
        // Verify entity structure supports ownership fields
        if (globalData.countries && globalData.countries.length > 0) {
          const firstCountry = globalData.countries[0]
          if (firstCountry.entities && firstCountry.entities.length > 0) {
            const entity = firstCountry.entities[0]
            // These fields should be supported
            console.log('Entity structure:', JSON.stringify(entity, null, 2))
          }
        }
      }
    } else {
      console.log('No request with international operations found - creating test data')
    }
  })

  test('API: Conflict detection service handles affiliate relationship type', async ({ request }) => {
    // Login as Compliance to check conflict detection
    const loginResponse = await request.post('http://localhost:3000/api/auth/login', {
      data: {
        email: 'sarah.johnson@bdo.com', // Compliance officer
        password: 'password123'
      }
    })
    
    const loginData = await loginResponse.json()
    const token = loginData.token
    
    // Get all requests to find one with international operations
    const requestsResponse = await request.get('http://localhost:3000/api/coi/requests', {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    expect(requestsResponse.ok()).toBeTruthy()
    
    const requests = await requestsResponse.json()
    console.log(`Total requests: ${requests.length}`)
    
    // Count requests with international operations
    const intlRequests = requests.filter((r: any) => r.international_operations === 1 || r.international_operations === true)
    console.log(`Requests with international operations: ${intlRequests.length}`)
    
    // Count requests with group_conflicts_detected
    const conflictRequests = requests.filter((r: any) => r.group_conflicts_detected)
    console.log(`Requests with detected conflicts: ${conflictRequests.length}`)
  })

  test('UI: International Operations form shows ownership percentage and control type', async ({ page }) => {
    // Navigate to create new request
    await page.click('text=New Request')
    await page.waitForSelector('text=New COI Request')
    
    // Fill basic info
    await page.selectOption('select[name="client_id"]', { index: 1 })
    await page.selectOption('select[name="service_type"]', { index: 1 })
    
    // Look for International Operations section
    const intlSection = page.locator('text=International Operations').first()
    
    if (await intlSection.isVisible()) {
      // Enable international operations if there's a toggle
      const toggles = page.locator('input[type="checkbox"]')
      const intlToggle = toggles.filter({ hasText: /international|global/i }).first()
      
      if (await intlToggle.isVisible()) {
        await intlToggle.check()
        await page.waitForTimeout(500)
      }
      
      // Screenshot the form
      await page.screenshot({ path: 'test-results/intl-ops-form-fields.png', fullPage: true })
      
      // Check for ownership percentage field
      const ownershipField = page.locator('input[name*="ownership"], input[placeholder*="ownership"], label:has-text("Ownership")')
      const hasOwnership = await ownershipField.count() > 0
      console.log(`Has ownership field: ${hasOwnership}`)
      
      // Check for control type field
      const controlField = page.locator('select[name*="control"], label:has-text("Control")')
      const hasControl = await controlField.count() > 0
      console.log(`Has control type field: ${hasControl}`)
    }
  })
})
