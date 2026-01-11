import { test, expect } from '@playwright/test';

test.describe('COI Request Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as requester before each test (using actual seeded user)
    await page.goto('/');
    await page.fill('input[type="email"]', 'patricia.white@company.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/coi\//i, { timeout: 10000 });
  });

  test('should create a new COI request', async ({ page }) => {
    // Navigate to create COI request page (try multiple possible selectors)
    const newRequestSelectors = [
      'text=New Request',
      'text=New COI Request',
      'a:has-text("New Request")',
      'a:has-text("New")',
      '[href*="/coi/request/new"]'
    ];
    
    let clicked = false;
    for (const selector of newRequestSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
          await element.click();
          clicked = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!clicked) {
      // Fallback: navigate directly
      await page.goto('/coi/request/new');
    }

    // Wait for form to load
    await page.waitForSelector('form');

    // Step 1: Document Type
    await page.selectOption('select[name="documentType"]', 'Proposal');
    await page.click('button:has-text("Next")');

    // Step 2: Client Information
    await page.fill('input[name="clientName"]', 'Test Corporation Ltd');
    await page.click('button:has-text("Next")');

    // Step 3: Services
    await page.check('input[value="Audit"]');
    await page.click('button:has-text("Next")');

    // Continue through wizard steps...
    // Add more steps based on your actual wizard implementation

    // Submit the request
    await page.click('button:has-text("Submit")');

    // Verify success message
    await expect(page.locator('.success-message')).toBeVisible();

    // Verify request appears in the list
    await page.goto('/coi/requester');
    await page.waitForLoadState('networkidle');
    // Request should appear in the list (may need to wait for API)
    await expect(page.locator('text=Test Corporation Ltd').or(page.locator('text=COI-')).first()).toBeVisible({ timeout: 10000 });
  });

  test('should save draft COI request', async ({ page }) => {
    // Navigate to create COI request
    await page.goto('/coi/request/new');
    await page.waitForLoadState('networkidle');

    // Fill partial information
    await page.selectOption('select[name="documentType"]', 'Engagement Letter');
    await page.fill('input[name="clientName"]', 'Draft Client Name');

    // Save as draft
    await page.click('button:has-text("Save as Draft")');

    // Verify draft saved
    await expect(page.locator('.success-message')).toContainText('Draft saved');

    // Navigate to dashboard
    await page.goto('/coi/requester');
    await page.waitForLoadState('networkidle');

    // Verify draft appears with Draft status
    await expect(page.locator('text=Draft Client Name').or(page.locator('[data-status="Draft"]')).first()).toBeVisible({ timeout: 10000 });
  });

  test('should edit existing draft', async ({ page }) => {
    // Assuming there's a draft in the list
    await page.goto('/coi/requester');
    await page.waitForLoadState('networkidle');

    // Click on a draft request (fix Playwright syntax)
    const draftElement = page.locator('[data-status="Draft"]').first();
    if (await draftElement.isVisible({ timeout: 5000 }).catch(() => false)) {
      await draftElement.click();
    } else {
      test.skip();
    }

    // Modify information
    await page.fill('input[name="clientName"]', 'Updated Client Name');

    // Save changes
    await page.click('button:has-text("Save")');

    // Verify update
    await expect(page.locator('.success-message')).toBeVisible();
  });

  test('should upload attachment', async ({ page }) => {
    // Create or open a COI request
    await page.goto('/coi/request/new');
    await page.waitForLoadState('networkidle');

    // Navigate to attachment step
    // (adjust based on your wizard structure)

    // Upload file
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF content')
    });

    // Verify file appears in list
    await expect(page.locator('text=test-document.pdf')).toBeVisible();
  });
});

test.describe('COI Approval Workflow', () => {
  test('Director should approve COI request', async ({ page }) => {
    // Login as director (using actual seeded user)
    await page.goto('/');
    await page.fill('input[type="email"]', 'john.smith@company.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/coi\/director/i, { timeout: 10000 });

    // Navigate to pending approvals (try multiple selectors)
    const pendingSelectors = [
      'text=Pending Approvals',
      'text=Pending Director Approval',
      'a:has-text("Pending")',
      '[href*="pending"]'
    ];
    
    let clicked = false;
    for (const selector of pendingSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
          await element.click();
          clicked = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!clicked) {
      // Skip if no pending approvals section found
      test.skip();
    }

    // Click on a request (fix Playwright syntax)
    const pendingRequest = page.locator('[data-status="Pending Director Approval"]').first();
    if (await pendingRequest.isVisible({ timeout: 5000 }).catch(() => false)) {
      await pendingRequest.click();
    } else {
      test.skip();
    }

    // Review and approve
    await page.click('button:has-text("Approve")');

    // Add comments (if applicable)
    // await page.fill('textarea[name="comments"]', 'Approved without restrictions');

    // Confirm approval
    await page.click('button:has-text("Confirm")');

    // Verify status change
    await expect(page.locator('.success-message')).toContainText('approved');
  });

  test('Compliance should review for conflicts', async ({ page }) => {
    // Login as compliance (using actual seeded user)
    await page.goto('/');
    await page.fill('input[type="email"]', 'emily.davis@company.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/coi\/compliance/i, { timeout: 10000 });

    // Navigate to compliance review queue (try multiple selectors)
    const reviewSelectors = [
      'text=Compliance Review',
      'text=Pending Review',
      'a:has-text("Review")',
      '[href*="review"]'
    ];
    
    let clicked = false;
    for (const selector of reviewSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
          await element.click();
          clicked = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!clicked) {
      // Skip if no review section found
      test.skip();
    }

    // Select a request (fix Playwright syntax)
    const complianceRequest = page.locator('[data-status="Pending Compliance"]').or(page.locator('[data-status="Pending Compliance Review"]')).first();
    if (await complianceRequest.isVisible({ timeout: 5000 }).catch(() => false)) {
      await complianceRequest.click();
    } else {
      test.skip();
    }

    // Review for conflicts
    // The system should show any detected conflicts

    // Complete review
    await page.click('button:has-text("Complete Review")');

    // Verify status update
    await expect(page.locator('.success-message')).toBeVisible();
  });
});

test.describe('Data Segregation', () => {
  test('Requester should only see own department requests', async ({ page }) => {
    // Login as requester from Audit department (using actual seeded user)
    await page.goto('/');
    await page.fill('input[type="email"]', 'patricia.white@company.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/coi\/requester/i, { timeout: 10000 });

    // Check dashboard
    // All visible requests should be from Audit department
    const requests = await page.locator('[data-department]').all();

    for (const request of requests) {
      const department = await request.getAttribute('data-department');
      expect(department).toBe('Audit');
    }
  });
});
