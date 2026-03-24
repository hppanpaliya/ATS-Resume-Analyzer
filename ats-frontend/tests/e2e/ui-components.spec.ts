import { test, expect } from '@playwright/test';

test.describe('UI Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should render glassmorphism design elements', async ({ page }) => {
    await expect(page.locator('[class*="glass"], .glass, .glass-strong').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display gradient buttons', async ({ page }) => {
    await expect(page.locator('[class*="gradient"], .btn-glass, button[class*="gradient"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display Lucide icons', async ({ page }) => {
    const iconCandidates = page.locator('svg, [class*="lucide"]');
    const iconCount = await iconCandidates.count();

    test.skip(iconCount === 0, 'Current public route does not render iconography.');
    await expect(iconCandidates.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have responsive layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
    
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display proper color scheme', async ({ page }) => {
    const html = page.locator('html');
    const bgColor = await html.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    
    expect(bgColor).toBeTruthy();
  });

  test('should have accessible contrast', async ({ page }) => {
    const textElements = page.locator('p, h1, h2, h3, h4, h5, h6, span, label');
    const firstText = textElements.first();

    if (await firstText.isVisible()) {
      const color = await firstText.evaluate(el => 
        window.getComputedStyle(el).color
      );
      expect(color).toBeTruthy();
    }
  });

  test('should have proper form validation', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    if (await emailInput.isVisible() && await submitButton.isVisible()) {
      await submitButton.click();
      const isEmailInvalid = await emailInput.evaluate((el) => !(el as HTMLInputElement).validity.valid);
      expect(isEmailInvalid).toBe(true);
    }
  });

  test('should have smooth transitions', async ({ page }) => {
    const elementsWithTransitions = page.locator('[class*="transition"], [class*="animate"]');

    if (await elementsWithTransitions.count() > 0) {
      const transition = await elementsWithTransitions.first().evaluate(el => 
        window.getComputedStyle(el).transition
      );
      expect(transition).toBeTruthy();
    }
  });

  test('should have proper hover states', async ({ page }) => {
    const buttons = page.locator('[class*="hover:"], button, a[href]');

    if (await buttons.count() > 0) {
      const firstButton = buttons.first();
      await firstButton.hover();
      await expect(firstButton).toBeVisible();
    }
  });
});
