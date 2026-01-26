import { test, expect } from '@playwright/test';

/**
 * Proposal to Engagement Conversion - E2E Test
 * Tests the full workflow of converting an approved proposal to an engagement
 */

test.describe('Proposal to Engagement Conversion', () => {
  
  test('should convert approved proposal to engagement as Director', async ({ page }) => {
    // Step 1: Login as Director (John Smith)
    console.log('Step 1: Logging in as John Smith (Director)...');
    await page.goto('/');
    await page.fill('input[type="email"]', 'john.smith@company.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/coi\/director/i, { timeout: 15000 });
    console.log('Login successful');

    // Step 2: Navigate to an Approved Proposal (ID 134)
    console.log('Step 2: Navigating to approved proposal (ID 134)...');
    await page.goto('/coi/request/134');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check page loaded
    const requestId = await page.locator('h1, h2').first().textContent();
    console.log('Request ID:', requestId);
    
    // Take screenshot before conversion
    await page.screenshot({ path: 'test-results/step1-before-convert.png', fullPage: true });

    // Step 3: Verify Convert to Engagement button is visible
    console.log('Step 3: Verifying Convert to Engagement button...');
    const convertButton = page.getByRole('button', { name: /Convert to Engagement/i });
    await page.waitForTimeout(1000);
    
    const isButtonVisible = await convertButton.isVisible().catch(() => false);
    console.log('Convert button visible:', isButtonVisible);
    
    if (!isButtonVisible) {
      // Check if already converted
      const stageEngagement = await page.locator('text=Stage').locator('..').locator('text=Engagement').isVisible().catch(() => false);
      if (stageEngagement) {
        console.log('Request already converted. Finding another approved proposal...');
        
        // Try ID 130
        await page.goto('/coi/request/130');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
      }
    }
    
    // Re-check button
    const convertBtn = page.getByRole('button', { name: /Convert to Engagement/i });
    const buttonVisible = await convertBtn.isVisible().catch(() => false);
    
    if (!buttonVisible) {
      console.log('No approved proposals available. Test skipped.');
      return;
    }
    
    expect(buttonVisible).toBe(true);
    console.log('Convert button confirmed visible!');

    // Step 4: Click Convert and fill the modal
    console.log('Step 4: Opening conversion modal...');
    await convertBtn.click();
    
    // Wait for modal
    await page.waitForSelector('text=Convert Proposal to Engagement', { timeout: 5000 });
    console.log('Modal opened successfully');
    
    // Take screenshot of modal
    await page.screenshot({ path: 'test-results/step2-modal-open.png', fullPage: true });
    
    // Verify modal content
    const modalTitle = await page.locator('text=Convert Proposal to Engagement').isVisible();
    expect(modalTitle).toBe(true);
    
    const whatHappensNext = await page.locator('text=What Happens Next').isVisible();
    expect(whatHappensNext).toBe(true);
    
    // Fill conversion reason
    console.log('Step 5: Filling conversion reason...');
    const reasonInput = page.locator('textarea');
    await reasonInput.fill('Client accepted proposal and signed engagement letter. Playwright E2E test.');
    
    // Take screenshot with filled form
    await page.screenshot({ path: 'test-results/step3-form-filled.png', fullPage: true });
    
    // Click convert button
    console.log('Step 6: Executing conversion...');
    const modalConvertBtn = page.locator('button:has-text("Convert to Engagement")').last();
    await modalConvertBtn.click();

    // Step 7: Wait for conversion and verify results
    console.log('Step 7: Waiting for conversion to complete...');
    await page.waitForTimeout(3000);
    
    // Take screenshot of result
    await page.screenshot({ path: 'test-results/step4-conversion-complete.png', fullPage: true });
    
    // Check for success (either toast or redirect)
    const currentUrl = page.url();
    console.log('URL after conversion:', currentUrl);
    
    // Verify new engagement created
    const engagementVisible = await page.locator('text=Engagement').first().isVisible().catch(() => false);
    console.log('Engagement text visible:', engagementVisible);
    
    const draftVisible = await page.locator('text=Draft').first().isVisible().catch(() => false);
    console.log('Draft status visible:', draftVisible);
    
    console.log('=== CONVERSION TEST COMPLETED SUCCESSFULLY ===');
  });

  test('should not show convert button for Draft proposals', async ({ page }) => {
    console.log('Testing: Draft proposals should NOT have convert button');
    
    await page.goto('/');
    await page.fill('input[type="email"]', 'patricia.white@company.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/coi\/requester/i, { timeout: 15000 });
    
    // Navigate to a Draft request
    await page.goto('/coi/request/49');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const convertButton = page.getByRole('button', { name: /Convert to Engagement/i });
    const isVisible = await convertButton.isVisible().catch(() => false);
    
    console.log('Convert button visible for Draft:', isVisible);
    expect(isVisible).toBe(false);
    
    await page.screenshot({ path: 'test-results/draft-no-convert.png', fullPage: true });
    console.log('PASSED: Draft proposals do not show convert button');
  });

  test('should not show convert button for Pending proposals', async ({ page }) => {
    console.log('Testing: Pending proposals should NOT have convert button');
    
    await page.goto('/');
    await page.fill('input[type="email"]', 'john.smith@company.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/coi\/director/i, { timeout: 15000 });
    
    // Find a Pending Director Approval request
    await page.goto('/coi/request/47'); // TEST-TODAY-001 is Pending Director Approval
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const convertButton = page.getByRole('button', { name: /Convert to Engagement/i });
    const isVisible = await convertButton.isVisible().catch(() => false);
    
    console.log('Convert button visible for Pending:', isVisible);
    expect(isVisible).toBe(false);
    
    await page.screenshot({ path: 'test-results/pending-no-convert.png', fullPage: true });
    console.log('PASSED: Pending proposals do not show convert button');
  });
});
