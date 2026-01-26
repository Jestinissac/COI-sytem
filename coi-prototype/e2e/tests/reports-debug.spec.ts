import { test, expect } from '@playwright/test'

test('Debug Reports Page', async ({ page }) => {
  // Capture console errors
  const consoleErrors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })
  
  // Capture network failures
  const networkErrors: string[] = []
  page.on('requestfailed', request => {
    networkErrors.push(`${request.url()} - ${request.failure()?.errorText}`)
  })
  
  // Login as Director
  await page.goto('http://localhost:5173/coi/login')
  await page.fill('input[type="email"]', 'john.smith@company.com')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/director**', { timeout: 15000 })
  await page.waitForTimeout(2000)
  
  // Go to Reports
  await page.click('text=Reports')
  await page.waitForTimeout(3000)
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/reports-debug-1.png', fullPage: true })
  
  // Click Generate Report button if visible
  const generateBtn = page.locator('button:has-text("Generate Report")')
  if (await generateBtn.isVisible()) {
    await generateBtn.click()
    await page.waitForTimeout(5000)
    await page.screenshot({ path: 'test-results/reports-debug-2.png', fullPage: true })
  }
  
  // Log errors
  console.log('Console Errors:', consoleErrors)
  console.log('Network Errors:', networkErrors)
  
  // Check for error message on page
  const errorMessage = page.locator('.text-red-600, .text-red-500, [class*="error"]')
  if (await errorMessage.first().isVisible()) {
    const errorText = await errorMessage.first().textContent()
    console.log('Error on page:', errorText)
  }
})
