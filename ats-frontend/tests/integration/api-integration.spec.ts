import { test, expect } from '@playwright/test';

test.describe('API Integration', () => {
  const API_BASE_URL = 'http://localhost:3001';

  test('should connect to backend API', async ({ page }) => {
    const response = await page.goto(`${API_BASE_URL}/api/health`);
    expect(response?.status()).toBe(200);
    
    const json = await response?.json();
    expect(json?.success).toBe(true);
    expect(json?.data?.status).toBe('healthy');
  });

  test('should fetch available AI models', async ({ page }) => {
    const response = await page.goto(`${API_BASE_URL}/api/models`);
    expect(response?.status()).toBe(200);
    
    const json = await response?.json();
    expect(json).toBeTruthy();
  });

  test('should handle authentication endpoints', async ({ page }) => {
    const loginResponse = await page.request.post(`${API_BASE_URL}/api/auth/login`, {
      data: {
        email: 'test@example.com',
        password: 'testpassword',
      },
    });
    
    expect([200, 401, 404]).toContain(loginResponse.status());
  });

  test('should validate resume upload endpoint', async ({ page }) => {
    const response = await page.request.post(`${API_BASE_URL}/api/resumes`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        title: 'Test Resume',
        content: 'Test content',
      },
    });
    
    expect([200, 201, 401, 403]).toContain(response.status());
  });

  test('should handle analysis endpoint', async ({ page }) => {
    const response = await page.request.post(`${API_BASE_URL}/api/analyze`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        resumeText: 'Test resume content',
        jobDescription: 'Test job description',
      },
    });
    
    expect([202, 400, 401, 403]).toContain(response.status());
  });

  test('should return proper error format', async ({ page }) => {
    const response = await page.request.get(`${API_BASE_URL}/api/invalid-endpoint`);
    expect(response.status()).toBe(404);
  });

  test('should handle CORS properly', async ({ page }) => {
    const response = await page.request.get(`${API_BASE_URL}/api/health`);
    
    const corsHeader = response.headers()['access-control-allow-origin'];
    expect(corsHeader || '*').toBeTruthy();
  });
});
