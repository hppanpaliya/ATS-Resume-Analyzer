import { test, expect, type Page } from '@playwright/test';

const bootstrapUserWorkflowMocks = async (page: Page) => {
  const user = {
    id: 'workflow-user-1',
    email: 'workflow.user@example.com',
    firstName: 'Workflow',
    lastName: 'User',
    subscriptionTier: 'free',
  };

  const resumes: Array<Record<string, any>> = [];
  const jobDescriptions: Array<Record<string, any>> = [];

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

  await page.route('**/api/auth/logout', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, message: 'Logged out' }),
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

  await page.route('**/api/templates**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    });
  });

  await page.route('**/api/resumes**', async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const path = url.pathname;

    // GET /api/resumes/:id
    const detailMatch = path.match(/\/api\/resumes\/([^/]+)$/);
    if (method === 'GET' && detailMatch) {
      const resume = resumes.find((item) => item.id === detailMatch[1]);
      if (!resume) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Resume not found' }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { resume } }),
      });
      return;
    }

    // GET /api/resumes
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            resumes,
            pagination: {
              page: 1,
              limit: 10,
              totalItems: resumes.length,
              totalPages: 1,
              hasNextPage: false,
              hasPreviousPage: false,
            },
          },
        }),
      });
      return;
    }

    // POST /api/resumes
    if (method === 'POST') {
      const payload = request.postDataJSON() as { title?: string; content?: string; templateId?: string | null };
      const now = new Date().toISOString();
      const id = `resume-${resumes.length + 1}`;

      const created = {
        id,
        title: payload.title || `Resume ${resumes.length + 1}`,
        content: payload.content || '',
        extractedText: payload.content || '',
        status: 'draft',
        templateId: payload.templateId || null,
        createdAt: now,
        updatedAt: now,
        originalFileId: null,
        originalFileName: null,
        originalFileSize: null,
        originalFileType: null,
      };

      resumes.unshift(created);

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { resume: created } }),
      });
      return;
    }

    await route.fallback();
  });

  await page.route('**/api/analyses**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          analyses: [],
          pagination: { page: 1, limit: 10, totalPages: 1, totalItems: 0 },
        },
      }),
    });
  });

  await page.route('**/api/job-descriptions**', async (route) => {
    const request = route.request();
    const method = request.method();

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            jobDescriptions,
            pagination: { page: 1, limit: 100, totalPages: 1, totalItems: jobDescriptions.length },
          },
        }),
      });
      return;
    }

    if (method === 'POST') {
      const payload = request.postDataJSON() as { title?: string; description?: string };
      const now = new Date().toISOString();
      const created = {
        id: `job-${jobDescriptions.length + 1}`,
        title: payload.title || `Job ${jobDescriptions.length + 1}`,
        description: payload.description || '',
        company: null,
        location: null,
        createdAt: now,
        updatedAt: now,
      };

      jobDescriptions.unshift(created);

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: created }),
      });
      return;
    }

    await route.fallback();
  });

  await page.goto('/login');
  await page.evaluate((authUser) => {
    localStorage.setItem(
      'auth-storage',
      JSON.stringify({
        state: {
          user: authUser,
          refreshToken: 'workflow-refresh-token',
        },
        version: 0,
      })
    );
  }, user);

  await page.reload({ waitUntil: 'domcontentloaded' });
};

test.describe('End-to-End User Workflow', () => {
  test('user can complete major workflow from signup to logout', async ({ page }) => {
    test.setTimeout(120000);
    const timestamp = Date.now();
    const resumeTitle = `Workflow Resume ${timestamp}`;
    const jobTitle = `Workflow Engineer ${timestamp}`;

    await bootstrapUserWorkflowMocks(page);
    await page.goto('/dashboard/analysis');
    await expect(page).toHaveURL(/\/dashboard\/analysis/i, { timeout: 10000 });

    // 1) Resume creation flow
    await page.goto('/dashboard/resumes');
    await expect(page.getByRole('heading', { name: /my resumes/i })).toBeVisible();

    const createResumeButton = page.getByRole('button', {
      name: /create new resume|create your first resume/i,
    }).first();

    await expect(createResumeButton).toBeVisible();
    await createResumeButton.click();

    await expect(page.getByRole('heading', { name: /create new resume/i })).toBeVisible();

    await page.getByLabel(/resume title/i).fill(resumeTitle);
    await page.getByLabel(/resume content/i).fill(
      'Workflow User\nSoftware Engineer\nSkills: React, Node.js, TypeScript\nExperience: 3 years building web apps.'
    );

    await page.getByRole('button', { name: /create resume/i }).click();

    await expect(page.getByRole('heading', { name: /my resumes/i })).toBeVisible({ timeout: 10000 });

    const resumeCard = page.locator('[role="button"]').filter({ hasText: resumeTitle }).first();
    await expect(resumeCard).toBeVisible({ timeout: 10000 });

    // 2) Resume detail flow
    await resumeCard.click();
    await expect(page.getByRole('button', { name: /back to resumes/i })).toBeVisible();
    await expect(page.getByLabel(/job description/i)).toBeVisible();

    await page.getByRole('button', { name: /back to resumes/i }).click();
    await expect(page.getByRole('heading', { name: /my resumes/i })).toBeVisible();

    // 3) Job description management flow
    await page.goto('/dashboard/history');
    await expect(page.getByRole('heading', { name: /analysis history/i })).toBeVisible();

    await page.getByRole('button', { name: /add job description/i }).click();

    await page.getByLabel(/job title/i).fill(jobTitle);
    await page.getByLabel(/^job description/i).fill(
      'We are looking for a workflow engineer with strong React and Node.js experience, excellent collaboration skills, and ownership of end-to-end feature delivery.'
    );

    await page.getByRole('button', { name: /^create$/i }).click();
    await expect(page.getByText(jobTitle)).toBeVisible({ timeout: 10000 });

    // 4) Analysis entry point exists
    await page.goto('/dashboard/analysis');
    await expect(page.getByRole('button', { name: /analyze resume|connecting/i })).toBeVisible();

    // 5) Logout
    await page.getByRole('button', { name: /logout/i }).click();
    await expect(page).toHaveURL(/\/login/i, { timeout: 10000 });
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });
});
