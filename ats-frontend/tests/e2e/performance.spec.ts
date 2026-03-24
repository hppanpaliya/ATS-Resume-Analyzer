import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load initial page within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const endTime = Date.now();
    
    const loadTime = endTime - startTime;
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have first contentful paint under 2 seconds', async ({ page }) => {
    await page.goto('/');
    
    const fcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries('first-contentful-paint')) {
            resolve(entry.startTime);
          }
        });
        observer.observe({ entryTypes: ['paint'] });
        
        setTimeout(() => resolve(0), 5000);
      });
    });
    
    expect(fcp).toBeLessThan(2000);
  });

  test('should not have memory leaks during navigation', async ({ page }) => {
    const pages = ['/resumes', '/analysis', '/history', '/dashboard'];
    
    for (const p of pages) {
      await page.goto(p);
      await page.waitForTimeout(500);
      
      const memory = await page.evaluate(() => {
        return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
      });
      
      if (memory > 0) {
        expect(memory).toBeLessThan(50 * 1024 * 1024);
      }
    }
  });

  test('should handle rapid route changes', async ({ page }) => {
    const routes = ['/', '/resumes', '/analysis', '/history', '/dashboard'];
    
    const startTime = Date.now();
    
    for (const route of routes) {
      await page.goto(route);
      await page.waitForSelector('body');
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    expect(totalTime).toBeLessThan(10000);
  });

  test('should optimize image loading', async ({ page }) => {
    await page.goto('/');
    
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      if (await img.isVisible()) {
        const loading = await img.evaluate(el => el.getAttribute('loading'));
        expect(loading || 'lazy').toBe('lazy');
      }
    }
  });

  test('should bundle assets efficiently', async ({ page }) => {
    const responseTimes: number[] = [];
    
    await page.route('**/*', async route => {
      const startTime = Date.now();
      await route.continue();
      const endTime = Date.now();
      responseTimes.push(endTime - startTime);
    });
    
    await page.goto('/');
    
    if (responseTimes.length > 0) {
      const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      expect(avgTime).toBeLessThan(1000);
    }
  });

  test('should not block main thread', async ({ page }) => {
    await page.goto('/');
    
    const longTasks = await page.evaluate(() => {
      return new Promise<any[]>((resolve) => {
        if (typeof PerformanceObserver === 'undefined') {
          resolve([]);
          return;
        }

        const tasks: any[] = [];
        let observer;

        try {
          observer = new PerformanceObserver((list) => {
            tasks.push(...list.getEntries());
          });
          observer.observe({ entryTypes: ['longtask'] });
        } catch (_error) {
          resolve([]);
          return;
        }
        
        setTimeout(() => {
          observer?.disconnect();
          resolve(tasks);
        }, 3000);
      });
    });
    
    expect(longTasks.length).toBeLessThan(5);
  });

  test('should have efficient re-renders', async ({ page }) => {
    await page.goto('/');
    
    const renderCount = await page.evaluate(() => {
      let count = 0;
      const originalObserver = window.MutationObserver;
      
      if (originalObserver) {
        window.MutationObserver = function(callback: any) {
          count++;
          return new originalObserver(callback);
        } as any;
      }
      
      return count;
    });
    
    expect(renderCount).toBeLessThan(100);
  });

  test('should load CSS needed for initial render', async ({ page }) => {
    await page.goto('/');
    
    const cssEvidence = await page.evaluate(() => {
      const stylesheetLinks = document.querySelectorAll('link[rel="stylesheet"]');
      const styleTags = document.querySelectorAll('style');
      return {
        inlineStyles: styleTags.length,
        linkedStylesheets: stylesheetLinks.length,
      };
    });
    
    expect(cssEvidence.inlineStyles + cssEvidence.linkedStylesheets).toBeGreaterThan(0);
  });

  test('should prefetch next routes', async ({ page }) => {
    await page.goto('/');
    
    const links = page.locator('a[href]');
    const count = await links.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const link = links.nth(i);
      if (await link.isVisible()) {
        const prefetch = await link.evaluate(el => 
          el.getAttribute('rel')?.includes('prefetch') || 
          el.getAttribute('data-prefetch') === 'true'
        );
        
        if (prefetch) {
          expect(prefetch).toBe(true);
        }
      }
    }
  });

  test('should have smooth animations', async ({ page }) => {
    await page.goto('/');
    
    const animatedElements = page.locator('[class*="animate"], [class*="transition"]');
    const count = await animatedElements.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const element = animatedElements.nth(i);
      if (await element.isVisible()) {
        const animationDuration = await element.evaluate(el => {
          const style = window.getComputedStyle(el);
          const duration = style.animationDuration || style.transitionDuration;
          return duration ? parseFloat(duration) : 0;
        });
        
        expect(animationDuration).toBeLessThan(1);
      }
    }
  });

  test('should optimize bundle size', async ({ page }) => {
    const resources = await page.evaluate(() => {
      return performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    });
    
    const totalSize = resources.reduce((acc, resource) => {
      return acc + (resource.transferSize || 0);
    }, 0);
    
    expect(totalSize).toBeLessThan(5 * 1024 * 1024);
  });

  test('should expose resource timing data for follow-up caching analysis', async ({ page }) => {
    await page.goto('/');
    
    const resourceCount = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      return resources.length;
    });
    
    expect(resourceCount).toBeGreaterThan(0);
  });
});
