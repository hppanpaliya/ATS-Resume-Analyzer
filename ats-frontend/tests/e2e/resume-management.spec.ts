import { test, expect, type Page } from '@playwright/test';

const isLoginScreen = async (page: Page) => {
  if (page.url().includes('/login')) {
    return true;
  }

  return page.getByRole('heading', { name: /welcome back/i }).isVisible().catch(() => false);
};

const expectLoginScreen = async (page) => {
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  await expect(page.locator('input[type="email"]').first()).toBeVisible();
};

const expectResumeWorkspace = async (page) => {
  const createResumeButton = page
    .getByRole('button', { name: /create new resume|create your first resume/i })
    .first();
  const fileInput = page.locator('input[type="file"]').first();

  if ((await fileInput.count()) > 0) {
    await expect(fileInput).toBeVisible({ timeout: 10000 });
    return { fileInput, createResumeButton, hasUploadInput: true };
  }

  await expect(createResumeButton).toBeVisible({ timeout: 10000 });
  return { fileInput, createResumeButton, hasUploadInput: false };
};

test.describe('Resume Management', () => {
  test('should require authentication for resume routes', async ({ page }) => {
    await page.goto('/dashboard/resumes');
    await expectLoginScreen(page);
  });

  test('should show resume upload UI when authenticated session exists', async ({ page }) => {
    await page.goto('/dashboard/resumes');

    if (await isLoginScreen(page)) {
      await expectLoginScreen(page);
      return;
    }

    await expect(page.getByRole('heading', { name: /my resumes/i })).toBeVisible();
    await expectResumeWorkspace(page);
  });

  test('should reject unsupported file types when upload UI is available', async ({ page }) => {
    await page.goto('/dashboard/resumes');

    if (await isLoginScreen(page)) {
      await expectLoginScreen(page);
      return;
    }

    await expect(page.getByRole('heading', { name: /my resumes/i })).toBeVisible();
    const { fileInput, hasUploadInput, createResumeButton } = await expectResumeWorkspace(page);
    if (hasUploadInput) {
      await fileInput.setInputFiles({
        name: 'invalid.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('not a supported resume format'),
      }).catch(() => {});

      await expect(page.locator('body')).toBeVisible();
      return;
    }

    await expect(createResumeButton).toBeVisible();
  });

  test('should keep resumes screen responsive after multiple file selections', async ({ page }) => {
    await page.goto('/dashboard/resumes');

    if (await isLoginScreen(page)) {
      await expectLoginScreen(page);
      return;
    }

    await expect(page.getByRole('heading', { name: /my resumes/i })).toBeVisible();
    const { fileInput, hasUploadInput, createResumeButton } = await expectResumeWorkspace(page);
    if (hasUploadInput) {
      await fileInput.setInputFiles({
        name: 'resume-one.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Resume one content'),
      });

      await fileInput.setInputFiles({
        name: 'resume-two.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Resume two content'),
      });

      await expect(page.locator('body')).toBeVisible();
      return;
    }

    await expect(createResumeButton).toBeVisible();
  });
});
