import { test, expect, type Page } from '@playwright/test';

const bootstrapAuthenticatedUiContext = async (page: Page) => {
  const user = {
    id: 'visual-user-1',
    email: 'visual.user@example.com',
    firstName: 'Visual',
    lastName: 'Tester',
    subscriptionTier: 'free',
  };

  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { user },
      }),
    });
  });

  await page.route('**/api/health', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          status: 'healthy',
          service: 'ATS Resume Analyzer API',
        },
      }),
    });
  });

  await page.route('**/api/resumes**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          resumes: [],
          pagination: {
            page: 1,
            limit: 10,
            totalItems: 0,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
      }),
    });
  });

  await page.route('**/api/analyses**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          analyses: [],
          pagination: {
            page: 1,
            limit: 10,
            totalItems: 0,
            totalPages: 1,
          },
        },
      }),
    });
  });

  await page.route('**/api/job-descriptions**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          jobDescriptions: [],
          pagination: {
            page: 1,
            limit: 100,
            totalItems: 0,
            totalPages: 1,
          },
        },
      }),
    });
  });

  await page.goto('/login');
  await page.evaluate((authUser) => {
    localStorage.setItem(
      'auth-storage',
      JSON.stringify({
        state: {
          user: authUser,
          refreshToken: 'visual-refresh-token',
        },
        version: 0,
      })
    );
  }, user);

  await page.reload({ waitUntil: 'domcontentloaded' });
};

const captureVisualEvidence = async (page: Page, name: string) => {
  await page.waitForLoadState('networkidle');

  const screenshot = await page.screenshot({
    fullPage: true,
    animations: 'disabled',
  });

  await test.info().attach(`${name}.png`, {
    body: screenshot,
    contentType: 'image/png',
  });

  // Basic assertion that we captured a non-empty render.
  expect(screenshot.byteLength).toBeGreaterThan(10_000);
};

test.describe('Visual Vision Coverage', () => {
  test('captures visual states for public auth screens', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await captureVisualEvidence(page, 'public-login-screen');

    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
    await captureVisualEvidence(page, 'public-signup-screen');
  });

  test('captures visual states for authenticated dashboard screens', async ({ page }) => {
    await bootstrapAuthenticatedUiContext(page);

    const screens = [
      { path: '/dashboard/analysis', key: 'dashboard-analysis-screen' },
      { path: '/dashboard/resumes', key: 'dashboard-resumes-screen' },
      { path: '/dashboard/history', key: 'dashboard-history-screen' },
    ];

    for (const screen of screens) {
      await page.goto(screen.path);
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('h1').first()).toBeVisible();
      await captureVisualEvidence(page, screen.key);
    }
  });
});
