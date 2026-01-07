import { test, expect } from '@playwright/test';

test.describe('COI Request Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as requester before each test
    await page.goto('/');
    await page.fill('input[type="email"]', 'requester@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  });

  test('should create a new COI request', async ({ page }) => {
    // Navigate to create COI request page
    await page.click('text=New COI Request');

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
    await page.goto('/dashboard');
    await expect(page.locator('text=Test Corporation Ltd')).toBeVisible();
  });

  test('should save draft COI request', async ({ page }) => {
    // Navigate to create COI request
    await page.click('text=New COI Request');

    // Fill partial information
    await page.selectOption('select[name="documentType"]', 'Engagement Letter');
    await page.fill('input[name="clientName"]', 'Draft Client Name');

    // Save as draft
    await page.click('button:has-text("Save as Draft")');

    // Verify draft saved
    await expect(page.locator('.success-message')).toContainText('Draft saved');

    // Navigate to dashboard
    await page.goto('/dashboard');

    // Verify draft appears with Draft status
    await expect(page.locator('text=Draft Client Name')).toBeVisible();
    await expect(page.locator('[data-status="Draft"]')).toBeVisible();
  });

  test('should edit existing draft', async ({ page }) => {
    // Assuming there's a draft in the list
    await page.goto('/dashboard');

    // Click on a draft request
    await page.click('[data-status="Draft"]').first();

    // Modify information
    await page.fill('input[name="clientName"]', 'Updated Client Name');

    // Save changes
    await page.click('button:has-text("Save")');

    // Verify update
    await expect(page.locator('.success-message')).toBeVisible();
  });

  test('should upload attachment', async ({ page }) => {
    // Create or open a COI request
    await page.click('text=New COI Request');

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
    // Login as director
    await page.goto('/');
    await page.fill('input[type="email"]', 'director@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Navigate to pending approvals
    await page.click('text=Pending Approvals');

    // Click on a request
    await page.click('[data-status="Pending Director Approval"]').first();

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
    // Login as compliance
    await page.goto('/');
    await page.fill('input[type="email"]', 'compliance@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Navigate to compliance review queue
    await page.click('text=Compliance Review');

    // Select a request
    await page.click('[data-status="Pending Compliance Review"]').first();

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
    // Login as requester from Audit department
    await page.goto('/');
    await page.fill('input[type="email"]', 'requester@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Check dashboard
    // All visible requests should be from Audit department
    const requests = await page.locator('[data-department]').all();

    for (const request of requests) {
      const department = await request.getAttribute('data-department');
      expect(department).toBe('Audit');
    }
  });
});
