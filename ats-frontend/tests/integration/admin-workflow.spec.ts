import { test, expect, type APIRequestContext } from '@playwright/test';

const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
const API_BASE_URL = env.PW_API_BASE_URL || 'http://localhost:3001';

const extractAccessToken = async (response: any) => {
  const body = await response.json();
  return body?.data?.tokens?.accessToken as string | undefined;
};

const loginAsRegularUser = async (request: APIRequestContext) => {
  const email = env.PW_USER_EMAIL || 'test@example.com';
  const password = env.PW_USER_PASSWORD || 'password123';

  const loginResponse = await request.post(`${API_BASE_URL}/api/auth/login`, {
    data: {
      email,
      password,
    },
  });

  if (loginResponse.status() === 429) {
    return null;
  }

  expect(
    loginResponse.status(),
    'Expected regular-user login to succeed. Set PW_USER_EMAIL/PW_USER_PASSWORD if defaults are unavailable.'
  ).toBe(200);

  const accessToken = await extractAccessToken(loginResponse);
  expect(accessToken).toBeTruthy();

  return accessToken as string;
};

test.describe('Admin vs User Workflow (API Integration)', () => {
  test('regular authenticated user is blocked from admin-only endpoints', async ({ request, browserName, isMobile }) => {
    test.skip(browserName !== 'chromium' || isMobile, 'Run once on desktop Chromium to avoid duplicated auth traffic across browser projects.');

    const accessToken = await loginAsRegularUser(request);
    test.skip(!accessToken, 'Regular-user login is currently rate-limited (429). Re-run after limiter window or restart backend.');

    const adminEndpoints = [
      { method: 'POST', path: '/api/templates/seed' },
      { method: 'GET', path: '/api/queue/stats' },
      { method: 'GET', path: '/api/health/upstream' },
    ] as const;

    for (const endpoint of adminEndpoints) {
      const response = endpoint.method === 'POST'
        ? await request.post(`${API_BASE_URL}${endpoint.path}`, {
            headers: { Authorization: `Bearer ${accessToken as string}` },
            timeout: 10000,
          })
        : await request.get(`${API_BASE_URL}${endpoint.path}`, {
            headers: { Authorization: `Bearer ${accessToken as string}` },
            timeout: 10000,
          });

      expect(
        [403, 429],
        `${endpoint.method} ${endpoint.path} should be blocked for non-admin user`
      ).toContain(response.status());

      const body = await response.json();
      const errorMessage = body?.error || body?.message || '';
      expect(String(errorMessage)).toMatch(/admin access required|too many requests/i);
    }
  });

  test('admin account can execute admin workflows when credentials are provided', async ({ request, browserName, isMobile }) => {
    test.skip(browserName !== 'chromium' || isMobile, 'Run once on desktop Chromium to avoid duplicated auth traffic across browser projects.');

    const email = env.PW_ADMIN_EMAIL;
    const password = env.PW_ADMIN_PASSWORD;

    test.skip(!email || !password, 'Set PW_ADMIN_EMAIL and PW_ADMIN_PASSWORD to validate live admin workflow');

    const loginResponse = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: { email, password },
    });

    test.skip(loginResponse.status() === 429, 'Admin login is currently rate-limited (429). Re-run after limiter window or restart backend.');

    expect(loginResponse.status(), 'Expected admin login to succeed').toBe(200);

    const accessToken = await extractAccessToken(loginResponse);
    expect(accessToken).toBeTruthy();

    const adminEndpoints = [
      '/api/queue/stats',
      '/api/health/upstream',
    ] as const;

    for (const endpointPath of adminEndpoints) {
      const response = await request.get(`${API_BASE_URL}${endpointPath}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            timeout: 10000,
          });

      // Some endpoints may return 500 due to external provider availability,
      // but admin auth itself must be accepted (not 401/403).
      expect([401, 403]).not.toContain(response.status());
    }
  });
});
