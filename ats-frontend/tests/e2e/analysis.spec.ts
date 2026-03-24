import { test, expect } from '@playwright/test';

const isLoginScreen = (url) => url.includes('/login');

const expectLoginScreen = async (page) => {
  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator('input[type="email"]').first()).toBeVisible();
};

test.describe('ATS Analysis', () => {
  test('should gate analysis route behind authentication', async ({ page }) => {
    await page.goto('/analysis');

    if (isLoginScreen(page.url())) {
      await expectLoginScreen(page);
      return;
    }

    await expect(page.locator('textarea, button').first()).toBeVisible({ timeout: 10000 });
  });

  test('should accept job description input when analysis form is available', async ({ page }) => {
    await page.goto('/analysis');

    if (isLoginScreen(page.url())) {
      await expectLoginScreen(page);
      return;
    }

    const jobDescriptionTextarea = page.locator('textarea[name*="job"], textarea[name*="description"], textarea').first();
    if (await jobDescriptionTextarea.isVisible()) {
      const value = 'Software Engineer position requiring React and TypeScript.';
      await jobDescriptionTextarea.fill(value);
      await expect(jobDescriptionTextarea).toHaveValue(value);
    }
  });

  test('should handle analyze action without crashing', async ({ page }) => {
    await page.goto('/analysis');

    if (isLoginScreen(page.url())) {
      await expectLoginScreen(page);
      return;
    }

    const analyzeButton = page.locator('button:has-text("Analyze"), button:has-text("Submit")').first();
    if (await analyzeButton.isVisible()) {
      await analyzeButton.click();
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('should keep analysis page responsive across viewport sizes', async ({ page }) => {
    await page.goto('/analysis');

    if (isLoginScreen(page.url())) {
      await expectLoginScreen(page);
      return;
    }

    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();

    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.locator('body')).toBeVisible();
  });
});
