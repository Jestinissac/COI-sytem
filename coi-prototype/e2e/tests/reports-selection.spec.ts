import { test, expect } from '@playwright/test'

test.describe('Reports Row Selection', () => {
  test('should allow selecting rows in filtered report data', async ({ page }) => {
    // Login as Director
    await page.goto('http://localhost:5173/coi/login')
    await page.fill('input[type="email"]', 'john.smith@company.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/director**', { timeout: 15000 })
    await page.waitForTimeout(2000)
    
    // Go to Reports
    await page.click('text=Reports')
    await page.waitForTimeout(2000)
    
    // Generate report
    await page.click('button:has-text("Generate Report")')
    await page.waitForTimeout(5000)
    
    // Scroll to table section
    await page.locator('text=Request Details').first().scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)
    
    // Screenshot before selection
    await page.screenshot({ path: 'test-results/reports-selection-1-before.png', fullPage: true })
    
    // Check if table is visible
    const table = page.locator('table')
    await expect(table).toBeVisible()
    
    // Check for checkboxes
    const checkboxes = page.locator('table input[type="checkbox"]')
    const checkboxCount = await checkboxes.count()
    console.log(`Found ${checkboxCount} checkboxes`)
    
    // Select first row (skip header checkbox)
    if (checkboxCount > 1) {
      await checkboxes.nth(1).check()
      await page.waitForTimeout(500)
      
      // Scroll to see selection bar
      await page.locator('text=Request Details').first().scrollIntoViewIfNeeded()
      await page.waitForTimeout(500)
      
      // Screenshot after selecting one row
      await page.screenshot({ path: 'test-results/reports-selection-2-one-selected.png' })
      
      // Check for selection bar
      const selectionBar = page.locator('text=row selected')
      const hasSelectionBar = await selectionBar.first().isVisible()
      console.log(`Selection bar visible: ${hasSelectionBar}`)
      
      // Also check for the blue selection bar
      const blueBar = page.locator('.bg-blue-50.border-blue-200')
      const hasBlueBar = await blueBar.first().isVisible()
      console.log(`Blue selection bar visible: ${hasBlueBar}`)
      
      // Select another row
      if (checkboxCount > 2) {
        await checkboxes.nth(2).check()
        await page.waitForTimeout(500)
        await page.screenshot({ path: 'test-results/reports-selection-3-two-selected.png', fullPage: true })
      }
      
      // Test Select All
      await checkboxes.nth(0).check() // Header checkbox
      await page.waitForTimeout(500)
      await page.screenshot({ path: 'test-results/reports-selection-4-all-selected.png', fullPage: true })
      
      // Test Clear Selection
      const clearBtn = page.locator('button:has-text("Clear Selection")')
      if (await clearBtn.isVisible()) {
        await clearBtn.click()
        await page.waitForTimeout(500)
        await page.screenshot({ path: 'test-results/reports-selection-5-cleared.png', fullPage: true })
      }
    }
  })
})
