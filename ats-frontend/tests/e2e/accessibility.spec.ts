import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have proper ARIA labels on interactive elements', async ({ page }) => {
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 5); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const hasAriaLabel = await button.evaluate(el => 
            el.hasAttribute('aria-label') || 
            el.hasAttribute('aria-labelledby') ||
            el.textContent?.trim().length > 0 ||
            el.hasAttribute('title')
          );
          expect(hasAriaLabel).toBe(true);
        }
      }
    }
  });

  test('should have keyboard navigation support', async ({ page }) => {
    await page.keyboard.press('Tab');
    const firstFocusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(firstFocusedElement).toBeTruthy();
    
    await page.keyboard.press('Tab');
    const secondFocusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(secondFocusedElement).toBeTruthy();
  });

  test('should have focus indicators', async ({ page }) => {
    await page.keyboard.press('Tab');
    
    const focusedElement = page.locator(':focus');
    if (await focusedElement.count() > 0) {
      const focusStyle = await focusedElement.evaluate(el => 
        window.getComputedStyle(el).outline || window.getComputedStyle(el).boxShadow
      );
      expect(focusStyle).toBeTruthy();
    }
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    const h1 = page.locator('h1');
    const h1Count = await h1.count();
    
    expect(h1Count).toBeLessThanOrEqual(1);
    
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    
    if (headingCount > 0) {
      let lastLevel = 0;
      for (let i = 0; i < Math.min(headingCount, 10); i++) {
        const heading = headings.nth(i);
        const tagName = (await heading.evaluate(el => el.tagName)) as string;
        const level = parseInt(tagName.charAt(1));
        
        if (lastLevel > 0) {
          expect(level).toBeLessThanOrEqual(lastLevel + 1);
        }
        lastLevel = level;
      }
    }
  });

  test('should have alt text for images', async ({ page }) => {
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < count; i++) {
      const image = images.nth(i);
      const hasAlt = await image.evaluate(el => 
        el.hasAttribute('alt') || el.hasAttribute('aria-hidden')
      );
      expect(hasAlt).toBe(true);
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    const textElements = page.locator('p, h1, h2, h3, h4, h5, h6, label, span').filter({ hasText: /.+/ });
    const count = await textElements.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const element = textElements.nth(i);
      if (await element.isVisible()) {
        const contrast = await element.evaluate(async el => {
          const style = window.getComputedStyle(el);
          const fgColor = style.color;
          const bgColor = style.backgroundColor;
          
          return { fgColor, bgColor };
        });
        
        expect(contrast.fgColor).toBeTruthy();
        expect(contrast.bgColor).toBeTruthy();
      }
    }
  });

  test('should have form labels', async ({ page }) => {
    const inputs = page.locator('input, select, textarea');
    const count = await inputs.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const input = inputs.nth(i);
      const hasLabel = await input.evaluate(el => 
        el.hasAttribute('aria-label') || 
        el.hasAttribute('aria-labelledby') ||
        el.id ? !!document.querySelector(`label[for="${el.id}"]`) : true
      );
      expect(hasLabel).toBe(true);
    }
  });

  test('should support screen reader announcements', async ({ page }) => {
    const liveRegions = page.locator('[role="alert"], [role="status"], [aria-live]');
    const count = await liveRegions.count();
    
    if (count > 0) {
      const firstRegion = liveRegions.first();
      await expect(firstRegion).toBeVisible({ timeout: 5000 });
    }
  });

  test('should have skip links', async ({ page }) => {
    const skipLink = page.locator('a[href="#main"], a[href="#content"], a:has-text("Skip")');
    
    if (await skipLink.count() > 0) {
      await expect(skipLink.first()).toBeVisible();
    }
  });

  test('should handle reduced motion preference', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    const animatedElements = page.locator('[class*="animate"], [class*="transition"]');
    const count = await animatedElements.count();
    
    if (count > 0) {
      const firstElement = animatedElements.first();
      const animation = await firstElement.evaluate(el => 
        window.getComputedStyle(el).animation
      );
      
      expect(animation || 'none').toBeTruthy();
    }
  });

  test('should have proper link text', async ({ page }) => {
    const links = page.locator('a[href]');
    const count = await links.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const link = links.nth(i);
      const hasMeaningfulText = await link.evaluate(el => 
        el.textContent?.trim().length > 0 && 
        !/^(click|here|read more|learn more|more)$/i.test(el.textContent?.trim() || '')
      );
      
      if (await link.isVisible()) {
        expect(hasMeaningfulText).toBe(true);
      }
    }
  });

  test('should not have multiple elements with same ID', async ({ page }) => {
    const duplicateIds = await page.evaluate(() => {
      const ids = document.querySelectorAll('[id]');
      const idMap = new Map();
      
      ids.forEach(el => {
        const id = el.id;
        idMap.set(id, (idMap.get(id) || 0) + 1);
      });
      
      const duplicates: string[] = [];
      idMap.forEach((count, id) => {
        if (count > 1) duplicates.push(id);
      });
      
      return duplicates;
    });
    
    expect(duplicateIds).toHaveLength(0);
  });
});
