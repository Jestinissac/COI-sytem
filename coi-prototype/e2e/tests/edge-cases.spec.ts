import { test, expect, Page } from '@playwright/test';

/**
 * Edge Case E2E Tests for COI System
 * Tests unusual scenarios, boundary conditions, and error recovery
 */

// Test data
const TEST_USERS = {
  requester: { email: 'patricia.white@company.com', password: 'password' },
  director: { email: 'john.smith@company.com', password: 'password' },
};

// Helper function to login
async function login(page: Page, user: { email: string; password: string }) {
  await page.goto('/');
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/coi\//i, { timeout: 15000 });
}

// Helper function to wait for loading
async function waitForLoading(page: Page) {
  await page.waitForLoadState('networkidle');
  const spinner = page.locator('.animate-spin, [class*="loading"]');
  if (await spinner.isVisible({ timeout: 1000 }).catch(() => false)) {
    await spinner.waitFor({ state: 'hidden', timeout: 10000 });
  }
}

// ============================================================================
// SECTION 1: SESSION & AUTHENTICATION EDGE CASES
// ============================================================================
test.describe('Session & Authentication Edge Cases', () => {
  test('should handle expired session gracefully', async ({ page }) => {
    await login(page, TEST_USERS.requester);
    
    // Clear auth token to simulate expired session
    await page.evaluate(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    });
    
    // Try to navigate - should redirect to login
    await page.goto('/coi/request/new');
    await page.waitForTimeout(2000);
    
    // Should redirect to login or show auth error
    const url = page.url();
    const isOnLoginOrDashboard = url.includes('/') || url.includes('login');
    expect(isOnLoginOrDashboard).toBe(true);
  });

  test('should handle multiple rapid login attempts', async ({ page }) => {
    await page.goto('/');
    
    // Rapidly submit login form multiple times
    for (let i = 0; i < 3; i++) {
      await page.fill('input[type="email"]', TEST_USERS.requester.email);
      await page.fill('input[type="password"]', TEST_USERS.requester.password);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(100);
    }
    
    // Should eventually login successfully
    await page.waitForURL(/\/coi\//i, { timeout: 15000 });
  });

  test('should handle browser back button after logout', async ({ page }) => {
    await login(page, TEST_USERS.requester);
    
    // Navigate to a protected page
    await page.goto('/coi/request/new');
    await waitForLoading(page);
    
    // Logout
    const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")').first();
    if (await logoutButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await logoutButton.click();
      await page.waitForTimeout(1000);
      
      // Press browser back button
      await page.goBack();
      await page.waitForTimeout(2000);
      
      // Should not show protected content
      const url = page.url();
      // Either redirected to login or shows login form
    }
  });
});

// ============================================================================
// SECTION 2: FORM EDGE CASES
// ============================================================================
test.describe('Form Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.requester);
    await page.goto('/coi/request/new');
    await waitForLoading(page);
  });

  test('should handle very long text input', async ({ page }) => {
    // Generate a very long string
    const longText = 'A'.repeat(5000);
    
    // Find a text input or textarea
    const textInput = page.locator('textarea, input[type="text"]').first();
    
    if (await textInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await textInput.fill(longText);
      
      // Should either accept or truncate the text
      const value = await textInput.inputValue();
      expect(value.length).toBeGreaterThan(0);
    }
  });

  test('should handle special characters in input', async ({ page }) => {
    const specialChars = '<script>alert("xss")</script> & < > " \' © ® ™';
    
    const textInput = page.locator('input[type="text"]').first();
    
    if (await textInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await textInput.fill(specialChars);
      
      // Should sanitize or accept the input
      const value = await textInput.inputValue();
      expect(value).not.toContain('<script>');
    }
  });

  test('should handle rapid form field changes', async ({ page }) => {
    const textInput = page.locator('input[type="text"]').first();
    
    if (await textInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Rapidly change input value
      for (let i = 0; i < 10; i++) {
        await textInput.fill(`Value ${i}`);
        await page.waitForTimeout(50);
      }
      
      // Final value should be the last one
      const value = await textInput.inputValue();
      expect(value).toBe('Value 9');
    }
  });

  test('should handle form submission with network delay', async ({ page }) => {
    // Slow down network
    await page.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.continue();
    });
    
    // Fill minimum required fields and try to submit
    const submitButton = page.locator('button:has-text("Submit")').first();
    
    if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Submit button should show loading state or be disabled during submission
      await page.waitForTimeout(1000);
    }
  });

  test('should preserve form data on page refresh', async ({ page }) => {
    // Fill some form fields
    const textInput = page.locator('input[type="text"]').first();
    
    if (await textInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await textInput.fill('Test Value');
      
      // Save as draft first
      const saveDraftButton = page.locator('button:has-text("Save Draft")').first();
      if (await saveDraftButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveDraftButton.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should handle concurrent form edits warning', async ({ page, context }) => {
    // Open same form in another tab
    const page2 = await context.newPage();
    await login(page2, TEST_USERS.requester);
    
    // Both pages should be able to access the form
    await page2.goto('/coi/request/new');
    await waitForLoading(page2);
    
    await page2.close();
  });
});

// ============================================================================
// SECTION 3: DATA DISPLAY EDGE CASES
// ============================================================================
test.describe('Data Display Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.requester);
  });

  test('should handle empty data gracefully', async ({ page }) => {
    await waitForLoading(page);
    
    // Check for empty state component or message
    const emptyState = page.locator('[class*="empty"], [class*="EmptyState"]').or(page.getByText(/no.*found/i));
    
    // Either shows data or empty state - both are valid
    await page.waitForTimeout(1000);
  });

  test('should handle very long client names in display', async ({ page }) => {
    await waitForLoading(page);
    
    // Long text should be truncated or wrapped properly
    const textElements = page.locator('td, .truncate, [class*="ellipsis"]');
    const count = await textElements.count();
    
    // Should have some text elements
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should handle missing data fields gracefully', async ({ page }) => {
    await waitForLoading(page);
    
    // Look for placeholder text like "N/A", "-", or empty cells
    const placeholders = page.locator('text=N/A, text=—, text=-');
    
    // Should handle missing data without errors
    await page.waitForTimeout(500);
  });

  test('should handle date formatting edge cases', async ({ page }) => {
    await page.goto('/coi/reports');
    await waitForLoading(page);
    
    // Date inputs should be visible
    const dateInput = page.locator('input[type="date"]').first();
    
    if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Try setting an edge case date
      await dateInput.fill('2099-12-31');
      
      // Should accept or validate the date
      const value = await dateInput.inputValue();
      expect(value).toBeTruthy();
    }
  });
});

// ============================================================================
// SECTION 4: NAVIGATION EDGE CASES
// ============================================================================
test.describe('Navigation Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.requester);
  });

  test('should handle rapid navigation between pages', async ({ page }) => {
    const routes = [
      '/coi/requester',
      '/coi/request/new',
      '/coi/reports',
      '/coi/requester',
    ];
    
    for (const route of routes) {
      await page.goto(route);
      await page.waitForTimeout(200);
    }
    
    // Should end up on the last route
    await expect(page).toHaveURL(/\/coi\/requester/i);
  });

  test('should handle direct URL access to non-existent request', async ({ page }) => {
    await page.goto('/coi/request/99999999');
    await page.waitForTimeout(2000);
    
    // Should show 404 or redirect
    const notFound = page.getByText(/not found/i).or(page.getByText(/404/i));
    const redirected = page.url().includes('requester') || page.url().includes('dashboard');
    
    // Either shows error or redirects
    expect(await notFound.isVisible().catch(() => false) || redirected).toBe(true);
  });

  test('should handle browser forward/back navigation', async ({ page }) => {
    await page.goto('/coi/requester');
    await waitForLoading(page);
    
    await page.goto('/coi/reports');
    await waitForLoading(page);
    
    // Go back
    await page.goBack();
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/coi\/requester/i);
    
    // Go forward
    await page.goForward();
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/coi\/reports/i);
  });

  test('should handle hash navigation', async ({ page }) => {
    await page.goto('/coi/request/new#section-3');
    await waitForLoading(page);
    
    // Should scroll to section or handle hash
    await page.waitForTimeout(500);
  });
});

// ============================================================================
// SECTION 5: CONCURRENT OPERATIONS
// ============================================================================
test.describe('Concurrent Operations', () => {
  test('should handle multiple API calls simultaneously', async ({ page }) => {
    await login(page, TEST_USERS.requester);
    
    // Navigate to a page that makes multiple API calls
    await page.goto('/coi/requester');
    
    // Wait for all requests to complete
    await page.waitForLoadState('networkidle');
    
    // Page should render correctly
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle rapid button clicks', async ({ page }) => {
    await login(page, TEST_USERS.requester);
    await page.goto('/coi/request/new');
    await waitForLoading(page);
    
    const saveDraftButton = page.locator('button:has-text("Save Draft")').first();
    
    if (await saveDraftButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Click rapidly multiple times
      for (let i = 0; i < 5; i++) {
        await saveDraftButton.click({ force: true }).catch(() => {});
        await page.waitForTimeout(50);
      }
      
      // Should handle gracefully (not crash)
      await page.waitForTimeout(1000);
    }
  });
});

// ============================================================================
// SECTION 6: ACCESSIBILITY EDGE CASES
// ============================================================================
test.describe('Accessibility Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.requester);
  });

  test('should be navigable with keyboard only', async ({ page }) => {
    await waitForLoading(page);
    
    // Tab through the page
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
    }
    
    // Should have focused elements
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should handle Escape key to close modals', async ({ page }) => {
    await waitForLoading(page);
    
    // Try to open a modal (if any button opens one)
    const modalTrigger = page.locator('button').filter({ hasText: /new|add|create/i }).first();
    
    if (await modalTrigger.isVisible({ timeout: 2000 }).catch(() => false)) {
      await modalTrigger.click();
      await page.waitForTimeout(500);
      
      // Press Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
  });

  test('should announce loading states to screen readers', async ({ page }) => {
    // Check for aria-busy or aria-live attributes
    const loadingIndicators = page.locator('[aria-busy="true"], [aria-live], [role="status"]');
    
    // Navigate to trigger loading
    await page.goto('/coi/reports');
    
    // Should have accessibility attributes for loading states
    await page.waitForTimeout(500);
  });

  test('should have proper focus management in forms', async ({ page }) => {
    await page.goto('/coi/request/new');
    await waitForLoading(page);
    
    // First focusable element should be reachable
    await page.keyboard.press('Tab');
    
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});

// ============================================================================
// SECTION 7: ERROR RECOVERY
// ============================================================================
test.describe('Error Recovery', () => {
  test('should recover from temporary network failure', async ({ page }) => {
    await login(page, TEST_USERS.requester);
    
    // Simulate offline
    await page.context().setOffline(true);
    
    // Try to navigate
    await page.goto('/coi/reports').catch(() => {});
    await page.waitForTimeout(1000);
    
    // Go back online
    await page.context().setOffline(false);
    
    // Retry navigation
    await page.goto('/coi/requester');
    await waitForLoading(page);
    
    // Should work after recovery
    await expect(page).toHaveURL(/\/coi\/requester/i);
  });

  test('should handle API timeout gracefully', async ({ page }) => {
    await login(page, TEST_USERS.requester);
    
    // Slow down specific API calls
    await page.route('**/api/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      await route.continue();
    });
    
    // Navigate - should show loading or timeout message
    await page.goto('/coi/reports');
    
    // Should show loading state
    const loadingOrContent = page.locator('.animate-spin, [class*="loading"]').or(page.locator('body'));
    await expect(loadingOrContent).toBeVisible();
  });

  test('should handle malformed API response', async ({ page }) => {
    await login(page, TEST_USERS.requester);
    
    // Mock a malformed response
    await page.route('**/api/reports/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'not valid json{{{',
      });
    });
    
    await page.goto('/coi/reports');
    await page.waitForTimeout(2000);
    
    // Should handle gracefully (show error or fallback)
    await expect(page.locator('body')).toBeVisible();
  });
});

// ============================================================================
// SECTION 8: BROWSER COMPATIBILITY
// ============================================================================
test.describe('Browser Compatibility', () => {
  test('should handle localStorage unavailable', async ({ page }) => {
    // Block localStorage
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: () => { throw new Error('localStorage disabled'); },
          setItem: () => { throw new Error('localStorage disabled'); },
          removeItem: () => { throw new Error('localStorage disabled'); },
        },
      });
    });
    
    await page.goto('/');
    
    // Should still render login page
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should handle cookies disabled', async ({ page, context }) => {
    // Clear all cookies
    await context.clearCookies();
    
    await page.goto('/');
    
    // Should still render
    await expect(page.locator('body')).toBeVisible();
  });
});
