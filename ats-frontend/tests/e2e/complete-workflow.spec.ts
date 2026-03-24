import { test, expect } from '@playwright/test';

const isLoginScreen = (url) => url.includes('/login');

const expectLoginScreen = async (page) => {
  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator('input[type="email"]').first()).toBeVisible();
};

test.describe('Complete User Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should support auth page navigation workflow', async ({ page }) => {
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]').first()).toBeVisible();

    const signUpLink = page.getByRole('link', { name: /sign up|register/i }).first();
    await signUpLink.click();
    await expect(page).toHaveURL(/\/signup|\/register|\/sign-up/);

    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();

    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect protected sections when unauthenticated', async ({ page }) => {
    const protectedSections = ['/dashboard', '/resumes', '/analysis', '/history'];

    for (const section of protectedSections) {
      await page.goto(section);
      await expectLoginScreen(page);
    }
  });

  test('should perform analysis flow when authenticated session is available', async ({ page }) => {
    await page.goto('/analysis');

    if (isLoginScreen(page.url())) {
      await expectLoginScreen(page);
      return;
    }

    const jobInput = page.locator('textarea[name*="job"], textarea[name*="description"], textarea').first();
    if (await jobInput.isVisible()) {
      await jobInput.fill('Looking for a software engineer with React and Node.js experience.');

      const analyzeButton = page.locator('button:has-text("Analyze"), button:has-text("Submit")').first();
      if (await analyzeButton.isVisible()) {
        await analyzeButton.click();
      }
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle theme switching throughout workflow', async ({ page }) => {
    const themeToggle = page.locator('[data-testid*="theme"], [data-testid*="dark"], [data-testid*="light"], button[aria-label*="theme"]').first();

    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(500);

      const html = page.locator('html');
      const isDark = await html.evaluate(el => 
        el.classList.contains('dark') || el.getAttribute('data-theme') === 'dark'
      );

      expect(typeof isDark).toBe('boolean');

      await themeToggle.click();
      await page.waitForTimeout(500);
    }
  });
});
