import { test, expect } from '@playwright/test'

test('Debug Reports Network Request', async ({ page }) => {
  // Capture API requests
  const apiRequests: any[] = []
  
  page.on('request', request => {
    if (request.url().includes('/api/reports/')) {
      apiRequests.push({
        url: request.url(),
        method: request.method(),
        postData: request.postData()
      })
    }
  })
  
  page.on('response', async response => {
    if (response.url().includes('/api/reports/')) {
      const status = response.status()
      let body = ''
      try {
        body = await response.text()
      } catch (e) {}
      console.log(`Response: ${response.url()} - Status: ${status}`)
      if (status >= 400) {
        console.log('Response body:', body.substring(0, 500))
      }
    }
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
  await page.waitForTimeout(2000)
  
  // Click Generate Report button
  const generateBtn = page.locator('button:has-text("Generate Report")')
  if (await generateBtn.isVisible()) {
    await generateBtn.click()
    await page.waitForTimeout(5000)
  }
  
  // Log captured requests
  console.log('API Requests captured:')
  apiRequests.forEach(req => {
    console.log(`  ${req.method} ${req.url}`)
    console.log(`  Body: ${req.postData}`)
  })
  
  await page.screenshot({ path: 'test-results/reports-network.png', fullPage: true })
})
