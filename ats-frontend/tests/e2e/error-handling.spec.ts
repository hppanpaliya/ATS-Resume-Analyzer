import { test, expect } from '@playwright/test';

const expectLoginScreen = async (page) => {
  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator('input[type="email"]').first()).toBeVisible();
  await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible();
};

test.describe('Error Handling & Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should handle network errors gracefully', async ({ page, context }) => {
    await context.setOffline(true);

    try {
      await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
      await expect(page.locator('body')).toBeVisible();
    } finally {
      await context.setOffline(false);
    }

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle aborted analysis calls without crashing', async ({ page }) => {
    await page.route('**/api/analyze', route => {
      route.abort('timedout');
    });

    const analyzeButton = page.locator('button:has-text("Analyze"), button:has-text("Submit")').first();
    if (await analyzeButton.isVisible()) {
      await analyzeButton.click();
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle invalid authentication', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    if (await emailInput.isVisible()) {
      await emailInput.fill('invalid@example.com');
      await passwordInput.fill('wrongpassword');

      const submitButton = page.locator('button[type="submit"]').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
      }
    }

    await expectLoginScreen(page);
  });

  test('should handle session expiration', async ({ page }) => {
    await page.goto('/dashboard');

    await page.evaluate(() => {
      localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          user: null,
          refreshToken: 'expired-refresh-token',
        },
        version: 0,
      }));
    });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expectLoginScreen(page);
  });

  test('should handle browser back and forward navigation', async ({ page }) => {
    await page.goto('/login');
    await page.goto('/signup');

    await page.goBack();
    await expect(page).toHaveURL(/\/login/);

    await page.goForward();
    await expect(page).toHaveURL(/\/signup/);
  });

  test('should handle malformed JSON responses', async ({ page }) => {
    await page.route('**/api/auth/refresh', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: '{ invalid json'
      });
    });

    await page.goto('/dashboard');
    await expectLoginScreen(page);
  });

  test('should handle duplicate submit clicks on login', async ({ page }) => {
    await page.goto('/login');
    const submitButton = page.locator('button[type="submit"]').first();

    if (await submitButton.isVisible()) {
      await submitButton.click();
      await submitButton.click();
      await submitButton.click();
    }

    await expect(page.locator('input[type="email"]').first()).toBeVisible();
  });
});
