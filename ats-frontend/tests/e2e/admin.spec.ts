import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';
import { createUniqueAuthUser, expectDashboardReady } from '../helpers/auth';

const databasePath = fileURLToPath(new URL('../../../ats-backend/prisma/dev.db', import.meta.url));

const promoteUserToAdmin = (email: string) => {
  const escapedEmail = email.replace(/'/g, "''");
  execFileSync('sqlite3', [
    databasePath,
    `UPDATE users SET subscriptionTier = 'admin', emailVerified = 1 WHERE email = '${escapedEmail}';`,
  ]);
};

test.describe('Admin Console', () => {
  test.describe.configure({ mode: 'serial' });

  test('admin can inspect and manage another user end to end', async ({ page, request, browserName }, testInfo) => {
    test.skip(browserName !== 'chromium', 'Live admin smoke runs once in chromium to avoid auth rate-limit noise.');

    const admin = createUniqueAuthUser(testInfo);
    const target = {
      email: `member.${Date.now()}@example.com`,
      password: 'Password123!',
      firstName: 'Target',
      lastName: 'Member',
    };
    const updatedPassword = 'Password456!';

    const [adminRegister, targetRegister] = await Promise.all([
      request.post('/api/auth/register', { data: admin }),
      request.post('/api/auth/register', { data: target }),
    ]);

    expect(adminRegister.ok()).toBeTruthy();
    expect(targetRegister.ok()).toBeTruthy();

    promoteUserToAdmin(admin.email);
    await expect
      .poll(async () => {
        const response = await request.post('/api/auth/login', {
          data: {
            email: admin.email,
            password: admin.password,
          },
        });

        return response.status();
      })
      .toBe(200);

    await page.goto('/login');
    await page.getByLabel(/^email$/i).fill(admin.email);
    await page.getByLabel(/^password$/i).fill(admin.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await expectDashboardReady(page);
    await page.getByRole('link', { name: /open admin console/i }).click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('heading', { name: /user operations/i })).toBeVisible();

    await page.getByLabel(/search users/i).fill(target.email);

    const targetCard = page.getByRole('button').filter({ hasText: target.email }).first();
    await expect(targetCard).toBeVisible();
    await targetCard.click();

    await expect(page.getByRole('heading', { name: target.email })).toBeVisible();

    await page.getByLabel(/first name/i).fill('Managed');
    await page.getByLabel(/last name/i).fill('User');
    await page.getByLabel(/subscription tier/i).selectOption('pro');
    await page.getByRole('button', { name: /save changes/i }).click();

    await expect(page.getByText(/user profile updated/i)).toBeVisible();
    await expect(page.getByText(/admin_user_updated/i)).toBeVisible();

    await page.getByLabel(/new password/i).fill(updatedPassword);
    await page.getByRole('button', { name: /set new password/i }).click();

    await expect(page.getByText(/password updated and/i)).toBeVisible();
    await expect(page.getByText(/admin_user_password_reset/i)).toBeVisible();

    await page.getByRole('button', { name: /revoke all sessions/i }).click();
    await expect(page.getByText(/active session\(s\) revoked/i)).toBeVisible();

    const targetLogin = await request.post('/api/auth/login', {
      data: {
        email: target.email,
        password: updatedPassword,
      },
    });

    expect(targetLogin.ok()).toBeTruthy();
  });

  test('non-admin users are redirected away from the admin route', async ({ page, browserName }, testInfo) => {
    test.skip(browserName !== 'chromium', 'Live admin route check runs once in chromium.');

    const user = createUniqueAuthUser(testInfo);

    await page.goto('/signup');
    await page.getByLabel(/first name/i).fill(user.firstName);
    await page.getByLabel(/last name/i).fill(user.lastName);
    await page.getByLabel(/^email$/i).fill(user.email);
    await page.getByLabel(/^password$/i).first().fill(user.password);
    await page.getByLabel(/confirm password/i).fill(user.password);
    await page.getByRole('button', { name: /create account/i }).click();

    await expectDashboardReady(page);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/dashboard\/analysis$/);
  });
});
