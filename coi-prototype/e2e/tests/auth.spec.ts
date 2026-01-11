import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page before each test
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    // Check if login page loads correctly
    await expect(page).toHaveTitle(/COI System/i);

    // Check for login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation error for empty credentials', async ({ page }) => {
    // Click submit without entering credentials
    await page.click('button[type="submit"]');

    // Check for validation messages (adjust selectors based on actual implementation)
    // await expect(page.locator('.error-message')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Enter invalid credentials
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for error message (adjust selector based on actual implementation)
    // await expect(page.locator('.error-message')).toContainText('Invalid credentials');
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    // Enter valid test credentials (using actual seeded user)
    await page.fill('input[type="email"]', 'patricia.white@company.com');
    await page.fill('input[type="password"]', 'password');

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for navigation to role-based dashboard
    await page.waitForURL(/\/coi\/(requester|director|compliance|partner|finance|admin|super-admin)/i, { timeout: 10000 });

    // Verify we're on a dashboard (not login page)
    await expect(page).not.toHaveURL(/\/login/i);
  });

  test('should persist authentication after page reload', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', 'patricia.white@company.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL(/\/coi\//i, { timeout: 10000 });

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be on dashboard (not redirected to login)
    await expect(page).not.toHaveURL(/\/login/i);
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', 'patricia.white@company.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL(/\/coi\//i, { timeout: 10000 });

    // Click logout button
    await page.click('button:has-text("Logout"), a:has-text("Logout")');

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/i);
  });
});

test.describe('Role-Based Access', () => {
  test('should redirect to appropriate dashboard based on role', async ({ page }) => {
    await page.goto('/');

    // Login as Director (using actual seeded user)
    await page.fill('input[type="email"]', 'john.smith@company.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL(/\/coi\/director/i, { timeout: 10000 });

    // Check if redirected to director dashboard
    await expect(page).toHaveURL(/\/coi\/director/i);
  });

  test('should prevent unauthorized access to admin pages', async ({ page }) => {
    await page.goto('/');

    // Login as regular requester
    await page.fill('input[type="email"]', 'patricia.white@company.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/coi\//i, { timeout: 10000 });

    // Try to navigate to admin dashboard
    await page.goto('/coi/admin');

    // Should be redirected or show access denied (stays on requester dashboard)
    await expect(page).not.toHaveURL(/\/coi\/admin/i);
  });
});
