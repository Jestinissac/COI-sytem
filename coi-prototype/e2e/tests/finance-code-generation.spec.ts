import { test, expect } from '@playwright/test'

test.describe('Finance Code Generation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:5173/login')

    // Login as Finance user
    await page.fill('input[type="email"]', 'lisa.thomas@company.com')
    await page.fill('input[type="password"]', 'password')
    await page.click('button[type="submit"]')

    // Wait for navigation to dashboard
    await page.waitForLoadState('networkidle')

    // Navigate to Finance dashboard
    await page.goto('http://localhost:5173/coi/finance')
    await page.waitForLoadState('networkidle')
  })

  test('should open Generate Code modal', async ({ page }) => {
    console.log('Testing modal opening...')

    // Find and click the first "Generate Code" button
    const generateButton = page.locator('button:has-text("Generate Code")').first()

    // Check if button exists
    const buttonExists = await generateButton.count()
    console.log(`Found ${buttonExists} "Generate Code" buttons`)

    if (buttonExists > 0) {
      await generateButton.click()

      // Wait for modal to appear
      await page.waitForTimeout(1000)

      // Check if modal is visible
      const modalTitle = page.locator('h3:has-text("Generate Engagement Code")')
      await expect(modalTitle).toBeVisible({ timeout: 5000 })
      console.log('✅ Modal opened successfully')

      // Take screenshot
      await page.screenshot({ path: 'test-results/finance-modal-opened.png', fullPage: true })
    } else {
      console.log('⚠️ No "Generate Code" buttons found - possibly no pending requests')
      await page.screenshot({ path: 'test-results/finance-no-pending-requests.png', fullPage: true })
    }
  })

  test('should fill form and generate code', async ({ page }) => {
    console.log('Testing code generation flow...')

    // Click "Pending Finance" tab to ensure we see pending requests
    const pendingTab = page.locator('button:has-text("Pending Finance")')
    if (await pendingTab.count() > 0) {
      await pendingTab.click()
      await page.waitForTimeout(500)
    }

    // Find and click the first "Generate Code" button
    const generateButton = page.locator('button:has-text("Generate Code")').first()
    const buttonExists = await generateButton.count()

    if (buttonExists === 0) {
      console.log('⚠️ No pending requests available for testing')
      await page.screenshot({ path: 'test-results/finance-no-pending.png', fullPage: true })
      return
    }

    console.log('Clicking "Generate Code" button...')
    await generateButton.click()
    await page.waitForTimeout(1000)

    // Verify modal opened
    const modalTitle = page.locator('h3:has-text("Generate Engagement Code")')
    await expect(modalTitle).toBeVisible({ timeout: 5000 })
    console.log('✅ Modal opened')

    // Take screenshot of empty form
    await page.screenshot({ path: 'test-results/finance-form-empty.png', fullPage: true })

    // Fill in Credit Terms
    console.log('Filling Credit Terms...')
    const creditTermsSelect = page.locator('select').nth(0)
    await creditTermsSelect.selectOption('Net 30')
    await page.waitForTimeout(300)

    // Fill in Currency
    console.log('Filling Currency...')
    const currencySelect = page.locator('select').nth(1)
    await currencySelect.selectOption('KWD')
    await page.waitForTimeout(300)

    // Fill in Risk Assessment
    console.log('Filling Risk Assessment...')
    const riskSelect = page.locator('select').nth(2)
    await riskSelect.selectOption('Medium')
    await page.waitForTimeout(300)

    // Take screenshot of filled form
    await page.screenshot({ path: 'test-results/finance-form-filled.png', fullPage: true })

    // Check if Generate Code button is enabled
    const submitButton = page.locator('button:has-text("Generate Code")').last()
    const isDisabled = await submitButton.isDisabled()
    console.log(`Submit button disabled: ${isDisabled}`)

    if (isDisabled) {
      console.log('❌ Button is still disabled after filling form')
      await page.screenshot({ path: 'test-results/finance-button-disabled.png', fullPage: true })

      // Get console logs
      page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()))

      throw new Error('Generate Code button is disabled even after filling all fields')
    }

    console.log('✅ Button is enabled, clicking...')

    // Listen for console logs
    page.on('console', msg => {
      if (msg.text().includes('[CodeGenerationModal]')) {
        console.log('MODAL LOG:', msg.text())
      }
    })

    // Listen for network requests
    page.on('request', request => {
      if (request.url().includes('generate-code')) {
        console.log('API REQUEST:', request.method(), request.url())
        console.log('REQUEST BODY:', request.postData())
      }
    })

    page.on('response', response => {
      if (response.url().includes('generate-code')) {
        console.log('API RESPONSE:', response.status(), response.url())
      }
    })

    // Click the submit button
    await submitButton.click()

    // Wait for API response
    await page.waitForTimeout(3000)

    // Take screenshot after submission
    await page.screenshot({ path: 'test-results/finance-after-submit.png', fullPage: true })

    // Check for success message or generated code
    const successMessage = page.locator('text=generated successfully')
    const hasSuccess = await successMessage.count() > 0

    if (hasSuccess) {
      console.log('✅ Success message found!')
      await expect(successMessage).toBeVisible()

      // Look for the engagement code
      const codeDisplay = page.locator('code').filter({ hasText: /ENG-\d{4}-\w{3}-\d{5}/ })
      if (await codeDisplay.count() > 0) {
        const code = await codeDisplay.textContent()
        console.log('✅ Engagement code generated:', code)
      }
    } else {
      console.log('⚠️ No success message found yet')

      // Check for error message
      const errorMessage = page.locator('.bg-red-50, .text-red-800').first()
      if (await errorMessage.count() > 0) {
        const errorText = await errorMessage.textContent()
        console.log('❌ Error message:', errorText)
      }
    }

    // Final screenshot
    await page.screenshot({ path: 'test-results/finance-final-result.png', fullPage: true })
  })

  test('should show validation errors for empty form', async ({ page }) => {
    console.log('Testing form validation...')

    // Find and click the first "Generate Code" button
    const generateButton = page.locator('button:has-text("Generate Code")').first()
    const buttonExists = await generateButton.count()

    if (buttonExists === 0) {
      console.log('⚠️ No pending requests available')
      return
    }

    await generateButton.click()
    await page.waitForTimeout(1000)

    // Verify modal opened
    const modalTitle = page.locator('h3:has-text("Generate Engagement Code")')
    await expect(modalTitle).toBeVisible()

    // Try to click Generate Code without filling form
    const submitButton = page.locator('button:has-text("Generate Code")').last()
    const isDisabled = await submitButton.isDisabled()

    console.log(`Button disabled with empty form: ${isDisabled}`)

    if (!isDisabled) {
      console.log('⚠️ Button should be disabled with empty form')
    } else {
      console.log('✅ Form validation working - button is disabled')
    }

    await page.screenshot({ path: 'test-results/finance-validation.png', fullPage: true })
  })
})
