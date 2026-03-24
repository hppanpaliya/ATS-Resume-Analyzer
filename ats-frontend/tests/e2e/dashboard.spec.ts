import { test, expect } from '@playwright/test';

const expectLoginScreen = async (page) => {
  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator('input[type="email"]').first()).toBeVisible();
  await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible();
};

test.describe('Dashboard Navigation', () => {
  test('should redirect unauthenticated users from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expectLoginScreen(page);
  });

  test('should redirect unauthenticated users from dashboard sub-routes', async ({ page }) => {
    const protectedRoutes = ['/dashboard/analysis', '/dashboard/resumes', '/dashboard/history'];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expectLoginScreen(page);
    }
  });

  test('should redirect unauthenticated users from legacy aliases', async ({ page }) => {
    const aliases = ['/analysis', '/resumes', '/history'];

    for (const route of aliases) {
      await page.goto(route);
      await expectLoginScreen(page);
    }
  });

  test('should keep login screen usable on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await expectLoginScreen(page);
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });
});
