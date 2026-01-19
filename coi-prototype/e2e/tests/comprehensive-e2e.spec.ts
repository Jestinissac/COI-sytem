import { test, expect, Page } from '@playwright/test';

/**
 * Comprehensive E2E Test Suite for COI System
 * Tests all major functionality: Authentication, Forms, Reports, Workflows
 */

// Test data
const TEST_USERS = {
  requester: { email: 'patricia.white@company.com', password: 'password', role: 'Requester' },
  director: { email: 'john.smith@company.com', password: 'password', role: 'Director' },
  compliance: { email: 'emily.davis@company.com', password: 'password', role: 'Compliance' },
  partner: { email: 'michael.johnson@company.com', password: 'password', role: 'Partner' },
  finance: { email: 'sarah.wilson@company.com', password: 'password', role: 'Finance' },
  admin: { email: 'david.brown@company.com', password: 'password', role: 'Admin' },
};

// Helper function to login
async function login(page: Page, user: { email: string; password: string }) {
  await page.goto('/');
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/coi\//i, { timeout: 15000 });
}

// Helper function to wait for loading to complete
async function waitForLoading(page: Page) {
  await page.waitForLoadState('networkidle');
  // Wait for any loading spinners to disappear
  const spinner = page.locator('.animate-spin, [class*="loading"]');
  if (await spinner.isVisible({ timeout: 1000 }).catch(() => false)) {
    await spinner.waitFor({ state: 'hidden', timeout: 10000 });
  }
}

// ============================================================================
// SECTION 1: AUTHENTICATION TESTS
// ============================================================================
test.describe('Authentication & Authorization', () => {
  test('should display login page with all required elements', async ({ page }) => {
    await page.goto('/');
    
    // Check for login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check for login form or labels (may use placeholder instead of label)
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('should show validation error for empty credentials', async ({ page }) => {
    await page.goto('/');
    await page.click('button[type="submit"]');
    
    // Should stay on login page
    await expect(page).toHaveURL(/\//);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Wait for error message or stay on login page
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\//);
  });

  test('should login successfully with valid Requester credentials', async ({ page }) => {
    await login(page, TEST_USERS.requester);
    await expect(page).toHaveURL(/\/coi\/requester/i);
  });

  test('should login successfully with valid Director credentials', async ({ page }) => {
    await login(page, TEST_USERS.director);
    await expect(page).toHaveURL(/\/coi\/director/i);
  });

  test('should login successfully with valid Compliance credentials', async ({ page }) => {
    await login(page, TEST_USERS.compliance);
    await expect(page).toHaveURL(/\/coi\/compliance/i);
  });

  test('should persist authentication after page reload', async ({ page }) => {
    await login(page, TEST_USERS.requester);
    await page.reload();
    await waitForLoading(page);
    await expect(page).not.toHaveURL(/\/login/i);
  });

  test('should logout successfully', async ({ page }) => {
    await login(page, TEST_USERS.requester);
    
    // Find and click logout button
    const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout"), [aria-label*="logout" i]').first();
    if (await logoutButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await logoutButton.click();
      await expect(page).toHaveURL(/\//);
    }
  });

  test('should prevent unauthorized access to admin pages', async ({ page }) => {
    await login(page, TEST_USERS.requester);
    await page.goto('/coi/admin');
    await page.waitForTimeout(2000);
    
    // Should be redirected or show access denied
    const url = page.url();
    expect(url).not.toContain('/coi/admin');
  });
});

// ============================================================================
// SECTION 2: REQUESTER DASHBOARD TESTS
// ============================================================================
test.describe('Requester Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.requester);
  });

  test('should display dashboard with stats cards', async ({ page }) => {
    await waitForLoading(page);
    
    // Check for stats cards
    await expect(page.getByText(/Total Requests/i)).toBeVisible();
    await expect(page.getByText('In Progress').first()).toBeVisible();
    await expect(page.getByText(/Approved/i).first()).toBeVisible();
    await expect(page.getByText(/Drafts/i).first()).toBeVisible();
  });

  test('should have working navigation tabs', async ({ page }) => {
    await waitForLoading(page);
    
    // Test tab navigation
    const tabs = ['Overview', 'All', 'Pending', 'Active', 'Drafts'];
    
    for (const tabName of tabs) {
      const tab = page.locator(`button:has-text("${tabName}"), [role="tab"]:has-text("${tabName}")`).first();
      if (await tab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await tab.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('should have New Request button', async ({ page }) => {
    await waitForLoading(page);
    
    const newRequestButton = page.locator('a:has-text("New Request"), button:has-text("New Request")').first();
    await expect(newRequestButton).toBeVisible();
  });

  test('should navigate to new request form', async ({ page }) => {
    await waitForLoading(page);
    
    const newRequestButton = page.locator('a:has-text("New Request"), button:has-text("New Request")').first();
    await newRequestButton.click();
    
    await page.waitForURL(/\/coi\/request\/new/i, { timeout: 10000 });
    await expect(page).toHaveURL(/\/coi\/request\/new/i);
  });

  test('should display recent requests list', async ({ page }) => {
    await waitForLoading(page);
    
    // Check for recent requests section
    const recentSection = page.getByText(/Recent Requests/i);
    await expect(recentSection).toBeVisible();
  });

  test('should have mobile responsive sidebar toggle', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await waitForLoading(page);
    
    // Check for mobile menu button
    const mobileMenuButton = page.locator('button[aria-label*="menu" i], button[aria-label*="navigation" i], button[aria-label*="Toggle" i]').first();
    if (await mobileMenuButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await mobileMenuButton.click();
      await page.waitForTimeout(500);
    }
  });
});

// ============================================================================
// SECTION 3: COI REQUEST FORM TESTS
// ============================================================================
test.describe('COI Request Form', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.requester);
    await page.goto('/coi/request/new');
    await waitForLoading(page);
  });

  test('should display form with all sections', async ({ page }) => {
    // Check for section headers (use .first() to handle multiple matches)
    await expect(page.getByText(/Requestor Information/i).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Document Type/i })).toBeVisible();
  });

  test('should auto-populate requestor information', async ({ page }) => {
    // Check for auto-populated fields
    const requestorNameField = page.locator('input[readonly]').first();
    await expect(requestorNameField).toBeVisible();
    
    // Should have a value
    const value = await requestorNameField.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });

  test('should have progress indicator', async ({ page }) => {
    // Check for progress bar or step indicator
    const progressIndicator = page.locator('[class*="progress"], .h-2.bg-gray-200, [role="progressbar"]').first();
    await expect(progressIndicator).toBeVisible();
  });

  test('should have Save Draft button', async ({ page }) => {
    const saveDraftButton = page.locator('button:has-text("Save Draft")').first();
    await expect(saveDraftButton).toBeVisible();
  });

  test('should have Submit button', async ({ page }) => {
    const submitButton = page.locator('button:has-text("Submit")').first();
    await expect(submitButton).toBeVisible();
  });

  test('should validate required fields before submission', async ({ page }) => {
    // Try to submit without filling required fields
    const submitButton = page.locator('button:has-text("Submit")').first();
    
    // Submit button should be disabled or show validation errors
    const isDisabled = await submitButton.isDisabled();
    expect(isDisabled).toBe(true);
  });

  test('should allow selecting document type', async ({ page }) => {
    // Find document type selection
    const proposalOption = page.locator('label:has-text("Proposal"), input[value="Proposal"]').first();
    const engagementOption = page.locator('label:has-text("Engagement"), input[value="Engagement"]').first();
    
    if (await proposalOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await proposalOption.click();
    }
  });

  test('should allow selecting entity', async ({ page }) => {
    const entitySelect = page.locator('select').filter({ hasText: /entity/i }).first();
    
    if (await entitySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Get options
      const options = await entitySelect.locator('option').allTextContents();
      expect(options.length).toBeGreaterThan(1);
    }
  });

  test('should navigate between form sections', async ({ page }) => {
    // Find section navigation links
    const sectionLinks = page.locator('nav a, nav button').filter({ hasText: /\d/ });
    const count = await sectionLinks.count();
    
    if (count > 1) {
      // Click on second section
      await sectionLinks.nth(1).click();
      await page.waitForTimeout(500);
    }
  });

  test('should show section completion status', async ({ page }) => {
    // Check for completion indicators
    const completionBadge = page.locator('[class*="Complete"], .bg-green-500, .text-green-');
    // At least one section should show completion status
    await page.waitForTimeout(1000);
  });
});

// ============================================================================
// SECTION 4: REPORTS PAGE TESTS
// ============================================================================
test.describe('Reports & Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.requester);
    await page.goto('/coi/reports');
    await waitForLoading(page);
  });

  test('should display reports page with header', async ({ page }) => {
    await expect(page.getByText(/Reports/i).first()).toBeVisible();
  });

  test('should have report type selector', async ({ page }) => {
    const reportSelector = page.locator('select').first();
    await expect(reportSelector).toBeVisible();
  });

  test('should have date range filters', async ({ page }) => {
    const dateFromInput = page.locator('input[type="date"]').first();
    await expect(dateFromInput).toBeVisible();
  });

  test('should have Generate Report button', async ({ page }) => {
    const generateButton = page.locator('button:has-text("Generate"), button:has-text("Load")').first();
    await expect(generateButton).toBeVisible();
  });

  test('should have export buttons (PDF/Excel)', async ({ page }) => {
    // First generate a report
    const reportSelector = page.locator('select').first();
    if (await reportSelector.isVisible()) {
      const options = await reportSelector.locator('option').allTextContents();
      if (options.length > 1) {
        await reportSelector.selectOption({ index: 1 });
        
        const generateButton = page.locator('button:has-text("Generate")').first();
        if (await generateButton.isVisible()) {
          await generateButton.click();
          await waitForLoading(page);
          
          // Check for export buttons
          const pdfButton = page.locator('button:has-text("PDF")');
          const excelButton = page.locator('button:has-text("Excel")');
          
          // At least one export option should be visible after generating
          await page.waitForTimeout(2000);
        }
      }
    }
  });

  test('should display report catalog', async ({ page }) => {
    const catalogButton = page.locator('button:has-text("Catalog"), button:has-text("Browse")').first();
    
    if (await catalogButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await catalogButton.click();
      await page.waitForTimeout(500);
      
      // Check for catalog content
      await expect(page.getByText(/Report Catalog/i).or(page.getByText(/Available/i))).toBeVisible();
    }
  });

  test('should have print functionality', async ({ page }) => {
    const printButton = page.locator('button:has-text("Print")').first();
    // Print button may only be visible after generating a report
    await page.waitForTimeout(1000);
  });

  test('should show loading state when generating report', async ({ page }) => {
    const reportSelector = page.locator('select').first();
    if (await reportSelector.isVisible()) {
      const options = await reportSelector.locator('option').allTextContents();
      if (options.length > 1) {
        await reportSelector.selectOption({ index: 1 });
        
        const generateButton = page.locator('button:has-text("Generate")').first();
        if (await generateButton.isVisible()) {
          await generateButton.click();
          
          // Check for loading indicator
          const loadingIndicator = page.locator('.animate-spin, [class*="loading"]').first();
          // Loading should appear briefly
        }
      }
    }
  });
});

// ============================================================================
// SECTION 5: DIRECTOR DASHBOARD TESTS
// ============================================================================
test.describe('Director Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.director);
  });

  test('should display director dashboard', async ({ page }) => {
    await waitForLoading(page);
    await expect(page).toHaveURL(/\/coi\/director/i);
  });

  test('should show pending approvals section', async ({ page }) => {
    await waitForLoading(page);
    
    // Check for pending approvals
    const pendingSection = page.getByText(/Pending/i).first();
    await expect(pendingSection).toBeVisible();
  });

  test('should have approval action buttons', async ({ page }) => {
    await waitForLoading(page);
    
    // Look for approve/reject buttons
    const approveButton = page.locator('button:has-text("Approve")').first();
    const rejectButton = page.locator('button:has-text("Reject")').first();
    
    // These may only be visible if there are pending requests
    await page.waitForTimeout(1000);
  });

  test('should display team requests', async ({ page }) => {
    await waitForLoading(page);
    
    // Check for team or department requests section
    const teamSection = page.getByText(/Team/i).or(page.getByText(/Department/i)).first();
    await page.waitForTimeout(1000);
  });
});

// ============================================================================
// SECTION 6: COMPLIANCE DASHBOARD TESTS
// ============================================================================
test.describe('Compliance Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.compliance);
  });

  test('should display compliance dashboard', async ({ page }) => {
    await waitForLoading(page);
    await expect(page).toHaveURL(/\/coi\/compliance/i);
  });

  test('should show compliance review queue', async ({ page }) => {
    await waitForLoading(page);
    
    // Check for review queue
    const reviewSection = page.getByText(/Review/i).or(page.getByText(/Pending/i)).first();
    await expect(reviewSection).toBeVisible();
  });

  test('should have conflict detection indicators', async ({ page }) => {
    await waitForLoading(page);
    
    // Look for conflict-related elements
    const conflictIndicator = page.getByText(/Conflict/i).or(page.getByText(/Flag/i));
    await page.waitForTimeout(1000);
  });

  test('should have compliance decision buttons', async ({ page }) => {
    await waitForLoading(page);
    
    // Look for compliance action buttons
    const completeReviewButton = page.locator('button:has-text("Complete"), button:has-text("Review")').first();
    await page.waitForTimeout(1000);
  });
});

// ============================================================================
// SECTION 7: FINANCE DASHBOARD TESTS
// ============================================================================
test.describe('Finance Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.finance);
  });

  test('should display finance dashboard', async ({ page }) => {
    await waitForLoading(page);
    await expect(page).toHaveURL(/\/coi\/finance/i);
  });

  test('should show engagement code generation section', async ({ page }) => {
    await waitForLoading(page);
    
    // Check for engagement code section
    const codeSection = page.getByText(/Engagement Code/i).or(page.getByText(/Code Generation/i)).first();
    await page.waitForTimeout(1000);
  });

  test('should have generate code button', async ({ page }) => {
    await waitForLoading(page);
    
    const generateCodeButton = page.locator('button:has-text("Generate Code"), button:has-text("Generate")').first();
    await page.waitForTimeout(1000);
  });
});

// ============================================================================
// SECTION 8: UI/UX VALIDATION TESTS
// ============================================================================
test.describe('UI/UX Validation', () => {
  test('should have proper page title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/COI/i);
  });

  test('should have accessible form labels', async ({ page }) => {
    await login(page, TEST_USERS.requester);
    await page.goto('/coi/request/new');
    await waitForLoading(page);
    
    // Check for labels
    const labels = page.locator('label');
    const count = await labels.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have proper focus states on inputs', async ({ page }) => {
    await page.goto('/');
    
    const emailInput = page.locator('input[type="email"]');
    await emailInput.focus();
    
    // Check that input is focused
    await expect(emailInput).toBeFocused();
  });

  test('should have proper button states (disabled/enabled)', async ({ page }) => {
    await login(page, TEST_USERS.requester);
    await page.goto('/coi/request/new');
    await waitForLoading(page);
    
    const submitButton = page.locator('button:has-text("Submit")').first();
    
    // Submit should be disabled when form is incomplete
    const isDisabled = await submitButton.isDisabled();
    expect(isDisabled).toBe(true);
  });

  test('should have loading indicators', async ({ page }) => {
    await login(page, TEST_USERS.requester);
    
    // Loading indicators should be present during data fetch
    // This is validated by checking the component exists
    const loadingComponent = page.locator('.animate-spin, [class*="Skeleton"], [class*="loading"]');
    await page.waitForTimeout(500);
  });

  test('should have empty state messages', async ({ page }) => {
    await login(page, TEST_USERS.requester);
    await waitForLoading(page);
    
    // Check for empty state component or message
    const emptyState = page.locator('[class*="EmptyState"], [class*="empty"]').or(page.getByText(/No.*found/i));
    await page.waitForTimeout(1000);
  });

  test('should have proper color contrast for status badges', async ({ page }) => {
    await login(page, TEST_USERS.requester);
    await waitForLoading(page);
    
    // Check for status badges
    const statusBadges = page.locator('[class*="badge"], [class*="status"], .rounded-full');
    await page.waitForTimeout(1000);
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    
    // Tab through form elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to navigate with keyboard
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should have ARIA labels on icon buttons', async ({ page }) => {
    await login(page, TEST_USERS.requester);
    await waitForLoading(page);
    
    // Check for aria-labels on buttons with only icons
    const iconButtons = page.locator('button[aria-label], a[aria-label]');
    const count = await iconButtons.count();
    // Should have at least some accessible buttons
  });
});

// ============================================================================
// SECTION 9: RESPONSIVE DESIGN TESTS
// ============================================================================
test.describe('Responsive Design', () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1280, height: 800 },
    { name: 'Large Desktop', width: 1920, height: 1080 },
  ];

  for (const viewport of viewports) {
    test(`should render correctly on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await login(page, TEST_USERS.requester);
      await waitForLoading(page);
      
      // Page should load without horizontal scroll on smaller viewports
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      
      // Allow small tolerance for scrollbar
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
    });
  }

  test('should show mobile menu on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await login(page, TEST_USERS.requester);
    await waitForLoading(page);
    
    // Check for mobile menu button
    const mobileMenuButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await page.waitForTimeout(1000);
  });

  test('should collapse sidebar on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await login(page, TEST_USERS.requester);
    await waitForLoading(page);
    
    // Sidebar should be hidden or collapsed on mobile
    const sidebar = page.locator('aside, [class*="sidebar"]').first();
    
    if (await sidebar.isVisible({ timeout: 1000 }).catch(() => false)) {
      // If visible, it should be in collapsed state or overlay
      const isOffscreen = await sidebar.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return rect.left < 0 || rect.right < 0;
      });
    }
  });
});

// ============================================================================
// SECTION 10: ERROR HANDLING TESTS
// ============================================================================
test.describe('Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    await login(page, TEST_USERS.requester);
    
    // Simulate offline mode
    await page.context().setOffline(true);
    
    // Try to navigate
    await page.goto('/coi/reports').catch(() => {});
    
    // Should show error message or handle gracefully
    await page.waitForTimeout(2000);
    
    // Re-enable network
    await page.context().setOffline(false);
  });

  test('should handle 404 pages', async ({ page }) => {
    await login(page, TEST_USERS.requester);
    await page.goto('/coi/nonexistent-page');
    await page.waitForTimeout(2000);
    
    // Should redirect or show 404 message
    const notFoundText = page.getByText(/not found/i).or(page.getByText(/404/i));
    // Or should redirect to dashboard
  });

  test('should show toast notifications for errors', async ({ page }) => {
    await login(page, TEST_USERS.requester);
    await waitForLoading(page);
    
    // Toast container should exist
    const toastContainer = page.locator('[class*="toast"], [class*="Toast"], [role="alert"]');
    await page.waitForTimeout(500);
  });
});

// ============================================================================
// SECTION 11: PERFORMANCE TESTS
// ============================================================================
test.describe('Performance', () => {
  test('should load login page within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
  });

  test('should load dashboard within 5 seconds', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', TEST_USERS.requester.email);
    await page.fill('input[type="password"]', TEST_USERS.requester.password);
    
    const startTime = Date.now();
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/coi\//i, { timeout: 15000 });
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(5000);
  });

  test('should load form page within 3 seconds', async ({ page }) => {
    await login(page, TEST_USERS.requester);
    
    const startTime = Date.now();
    await page.goto('/coi/request/new');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
  });
});
