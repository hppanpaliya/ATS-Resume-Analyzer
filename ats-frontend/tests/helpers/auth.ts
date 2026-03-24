import type { Page, TestInfo } from '@playwright/test';

export type TestAuthUser = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

export const createUniqueAuthUser = (testInfo: TestInfo): TestAuthUser => {
  const nonce = `${Date.now()}-${testInfo.workerIndex}-${testInfo.retry}`;

  return {
    email: `playwright.${nonce}@example.com`,
    password: 'Password123!',
    firstName: 'Playwright',
    lastName: `User${testInfo.workerIndex}`,
  };
};

export const expectDashboardReady = async (page: Page) => {
  await page.waitForURL(/\/dashboard(?:\/.*)?$/, { timeout: 30_000 });
  await page.getByRole('heading', { name: /ats resume analyzer/i }).waitFor({ timeout: 30_000 });
};

export const expectLoggedOut = async (page: Page) => {
  await page.waitForURL(/\/login$/, { timeout: 30_000 });
  await page.getByRole('heading', { name: /welcome back/i }).waitFor({ timeout: 30_000 });
};
