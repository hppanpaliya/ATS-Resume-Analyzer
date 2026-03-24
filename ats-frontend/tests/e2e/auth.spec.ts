import { test, expect } from '@playwright/test';
import { createUniqueAuthUser, expectDashboardReady, expectLoggedOut } from '../helpers/auth';

test.describe('Authentication Flow', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should support a full live signup, refresh, logout, and login loop', async ({ page, browserName }, testInfo) => {
    test.skip(browserName !== 'chromium', 'Live auth smoke runs once to avoid rate limiter noise across all projects.');

    const user = createUniqueAuthUser(testInfo);

    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();

    await page.getByRole('link', { name: /sign up/i }).click();
    await expect(page).toHaveURL(/\/signup/);
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();

    await page.getByLabel(/first name/i).fill(user.firstName);
    await page.getByLabel(/last name/i).fill(user.lastName);
    await page.getByLabel(/^email$/i).fill(user.email);
    await page.getByLabel(/^password$/i).first().fill(user.password);
    await page.getByLabel(/confirm password/i).fill(user.password);
    await page.getByRole('button', { name: /create account/i }).click();

    await expectDashboardReady(page);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expectDashboardReady(page);

    await page.getByRole('button', { name: /logout/i }).click();
    await expectLoggedOut(page);

    const storedAuth = await page.evaluate(() => JSON.parse(localStorage.getItem('auth-storage') || '{}'));
    expect(storedAuth?.state?.refreshToken ?? null).toBeNull();

    await page.getByLabel(/^email$/i).fill(user.email);
    await page.getByLabel(/^password$/i).fill(user.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await expectDashboardReady(page);
    await page.getByRole('button', { name: /logout/i }).click();
    await expectLoggedOut(page);
  });

  test('should surface a helpful error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
    await page.getByLabel(/^email$/i).fill('missing-user@example.com');
    await page.getByLabel(/^password$/i).fill('wrong-password');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByRole('alert')).toContainText(/invalid email or password/i);
    await expect(page).toHaveURL(/\/login/);
  });
});
