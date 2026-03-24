import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotRoot = path.resolve(__dirname, '../../../docs/presentation/screenshots');

const freeUser = {
  id: 'presentation-user-1',
  email: 'presentation.user@example.com',
  firstName: 'Presentation',
  lastName: 'User',
  subscriptionTier: 'free',
};

const adminUser = {
  id: 'presentation-admin-1',
  email: 'admin.presenter@example.com',
  firstName: 'Admin',
  lastName: 'Presenter',
  subscriptionTier: 'admin',
};

const mockModels = [
  {
    id: 'openrouter/free',
    name: 'OpenRouter Free',
    provider: 'OpenRouter',
    description: 'Routes requests to an available free model.',
    created: 1735689600,
    context_length: 128000,
    recommended: true,
  },
  {
    id: 'meta-llama/llama-3.1-8b-instruct:free',
    name: 'Llama 3.1 8B Instruct',
    provider: 'Meta',
    description: 'General-purpose language model with strong reasoning for structured tasks.',
    created: 1735603200,
    context_length: 131072,
    recommended: false,
  },
];

const mockResumeSummary = {
  id: 'resume-001',
  title: 'Senior Frontend Engineer Resume',
  createdAt: '2026-03-01T10:00:00.000Z',
  updatedAt: '2026-03-03T12:00:00.000Z',
  status: 'published',
  previewText:
    'Frontend engineer with 6+ years building scalable React platforms, design systems, and performance-critical UI flows.',
  templateId: 'template-modern',
  templateName: 'Modern ATS',
  originalFileId: 'file-001',
  originalFileName: 'senior-frontend-resume.pdf',
};

const mockResumeDetail = {
  ...mockResumeSummary,
  content: `PRATIK SHAH\nSenior Frontend Engineer\n\nEXPERIENCE\n- Led migration from legacy UI to React + TypeScript micro-frontends\n- Improved Core Web Vitals by 38% across customer portal\n- Built reusable design system used by 4 product teams\n\nSKILLS\nReact, TypeScript, Node.js, Accessibility, Testing, CI/CD\n\nEDUCATION\nM.Sc. Computer Science`,
};

const mockAnalyses = [
  {
    id: 'analysis-001',
    jobTitle: 'Senior Frontend Engineer',
    overallScore: 84,
    createdAt: '2026-03-03T10:15:00.000Z',
    modelUsed: 'openrouter/free',
    resume: {
      title: mockResumeSummary.title,
    },
  },
];

const mockAnalysisDetail = {
  id: 'analysis-001',
  savedAnalysisId: 'analysis-001',
  overallScore: 84,
  resume: {
    id: mockResumeSummary.id,
    title: mockResumeSummary.title,
  },
  skillsAnalysis: {
    matchedKeywords: ['React', 'TypeScript', 'REST APIs', 'CI/CD', 'Accessibility'],
    missingKeywords: ['GraphQL', 'Micro-frontends', 'Performance budget'],
    recommendations: [
      'Mention measurable React performance improvements in your last role.',
      'Add one bullet explicitly covering cross-team architecture leadership.',
      'Include GraphQL exposure if you have worked with schema-driven APIs.',
    ],
  },
  formattingScore: {
    score: 88,
    issues: ['Summary section lacks targeted role keywords.', 'Inconsistent date format in one experience entry.'],
    suggestions: ['Add role-specific keywords in summary.', 'Use MM/YYYY format consistently for all roles.'],
  },
  experienceRelevance: {
    score: 79,
    relevantExperience:
      'Strong alignment with frontend architecture, React component systems, and product collaboration.',
    gaps: [
      'Needs one project highlighting GraphQL/API contract optimization.',
      'Could emphasize experience mentoring engineers across teams.',
    ],
  },
  actionableAdvice: [
    'Quantify impact in at least 3 experience bullets using business outcomes.',
    'Add missing stack terms from the target JD naturally in context.',
    'Reorder sections so the strongest role-specific achievements appear first.',
    'Highlight accessibility testing ownership with tooling examples.',
  ],
};

const mockJobDescriptions = [
  {
    id: 'job-001',
    title: 'Senior Frontend Engineer - Platform',
    description:
      'We are hiring a Senior Frontend Engineer with strong React and TypeScript experience, system design collaboration, and performance optimization expertise.',
    createdAt: '2026-03-02T08:45:00.000Z',
  },
];

const mockAdminUsers = [
  {
    id: 'user-100',
    email: 'candidate.one@example.com',
    firstName: 'Candidate',
    lastName: 'One',
    phone: '+1-555-0131',
    subscriptionTier: 'pro',
    emailVerified: true,
    deletedAt: null,
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-03-01T11:00:00.000Z',
    lastLoginAt: '2026-03-03T09:00:00.000Z',
    counts: {
      resumes: 2,
      analyses: 7,
      jobDescriptions: 3,
      aiUsage: 19,
      refreshSessions: 4,
    },
  },
  {
    id: 'user-101',
    email: 'candidate.two@example.com',
    firstName: 'Candidate',
    lastName: 'Two',
    phone: null,
    subscriptionTier: 'free',
    emailVerified: false,
    deletedAt: null,
    createdAt: '2026-02-18T10:20:00.000Z',
    updatedAt: '2026-03-02T15:00:00.000Z',
    lastLoginAt: '2026-03-02T15:30:00.000Z',
    counts: {
      resumes: 1,
      analyses: 2,
      jobDescriptions: 1,
      aiUsage: 4,
      refreshSessions: 1,
    },
  },
];

const mockAdminDetail = {
  user: {
    id: 'user-100',
    email: 'candidate.one@example.com',
    firstName: 'Candidate',
    lastName: 'One',
    phone: '+1-555-0131',
    subscriptionTier: 'pro',
    emailVerified: true,
    deletedAt: null,
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-03-01T11:00:00.000Z',
    lastLoginAt: '2026-03-03T09:00:00.000Z',
    analysesRunToday: 1,
    counts: {
      resumes: 2,
      analyses: 7,
      jobDescriptions: 3,
      aiUsage: 19,
      refreshSessions: 4,
    },
  },
  recentResumes: [
    {
      id: 'resume-001',
      title: 'Senior Frontend Engineer Resume',
      status: 'published',
      updatedAt: '2026-03-01T11:00:00.000Z',
    },
  ],
  recentAnalyses: [
    {
      id: 'analysis-001',
      analysisType: 'ats_analysis',
      status: 'completed',
      aiProvider: 'openrouter',
      modelUsed: 'openrouter/free',
      createdAt: '2026-03-03T10:15:00.000Z',
    },
  ],
  recentJobDescriptions: [
    {
      id: 'job-001',
      title: 'Senior Frontend Engineer - Platform',
      company: 'Acme Labs',
      location: 'Remote',
      updatedAt: '2026-03-02T08:45:00.000Z',
    },
  ],
  recentSessions: [
    {
      id: 'session-001',
      createdAt: '2026-03-03T08:30:00.000Z',
      expiresAt: '2026-03-10T08:30:00.000Z',
      revokedAt: null,
    },
  ],
  recentAiUsage: [
    {
      id: 'usage-001',
      feature: 'analysis',
      aiProvider: 'openrouter',
      tokensUsed: 1132,
      estimatedCost: '0.01',
      responseTimeMs: 860,
      createdAt: '2026-03-03T10:16:00.000Z',
    },
  ],
  recentAuditLogs: [
    {
      id: 'audit-001',
      userId: 'presentation-admin-1',
      action: 'ADMIN_USER_UPDATED',
      entityType: 'user',
      entityId: 'user-100',
      createdAt: '2026-03-03T11:10:00.000Z',
      changes: {
        before: { subscriptionTier: 'free' },
        after: { subscriptionTier: 'pro' },
      },
    },
  ],
};

const ensureDeviceFolder = (device: 'desktop' | 'mobile') => {
  const dirPath = path.join(screenshotRoot, device);
  mkdirSync(dirPath, { recursive: true });
  return dirPath;
};

const takeShot = async (page: Page, device: 'desktop' | 'mobile', name: string) => {
  const outDir = ensureDeviceFolder(device);
  await expect(page.locator('body')).toBeVisible();
  await page.waitForTimeout(200);
  await page.screenshot({
    path: path.join(outDir, `${name}.png`),
    fullPage: true,
    animations: 'disabled',
  });
};

const fulfillJson = async (route: Parameters<Page['route']>[1] extends (...args: infer T) => unknown ? T[0] : never, body: unknown, status = 200) => {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
};

const installApiMocks = async (page: Page, user: typeof freeUser, withAdminData = false) => {
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const { pathname } = url;

    if (pathname === '/api/health' && method === 'GET') {
      return fulfillJson(route, {
        success: true,
        data: {
          status: 'healthy',
          service: 'ATS Resume Analyzer API',
        },
      });
    }

    if (pathname === '/api/auth/me' && method === 'GET') {
      return fulfillJson(route, {
        success: true,
        data: { user },
      });
    }

    if (pathname === '/api/models' && method === 'GET') {
      return fulfillJson(route, {
        success: true,
        data: mockModels,
      });
    }

    if (pathname === '/api/templates' && method === 'GET') {
      return fulfillJson(route, {
        success: true,
        data: [
          {
            id: 'template-modern',
            name: 'Modern ATS',
            description: 'ATS-friendly modern resume template.',
          },
          {
            id: 'template-compact',
            name: 'Compact ATS',
            description: 'Compact one-page ATS template.',
          },
        ],
      });
    }

    if (pathname === '/api/resumes' && method === 'GET') {
      return fulfillJson(route, {
        success: true,
        data: {
          resumes: [mockResumeSummary],
          pagination: {
            page: 1,
            limit: 10,
            totalItems: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
      });
    }

    if (pathname === '/api/resumes/resume-001' && method === 'GET') {
      return fulfillJson(route, {
        success: true,
        data: {
          resume: mockResumeDetail,
        },
      });
    }

    if (pathname === '/api/resumes/preview' && method === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<!doctype html><html><body><h1 style="font-family:Arial">Resume Preview</h1><p>Preview generated for presentation screenshots.</p></body></html>',
      });
    }

    if (pathname === '/api/analyses' && method === 'GET') {
      return fulfillJson(route, {
        success: true,
        data: {
          analyses: mockAnalyses,
          pagination: {
            page: 1,
            limit: 10,
            totalItems: 1,
            totalPages: 1,
          },
        },
      });
    }

    if (pathname === '/api/analyses/analysis-001' && method === 'GET') {
      return fulfillJson(route, {
        success: true,
        data: mockAnalysisDetail,
      });
    }

    if (pathname === '/api/job-descriptions' && method === 'GET') {
      return fulfillJson(route, {
        success: true,
        data: {
          jobDescriptions: mockJobDescriptions,
          pagination: {
            page: 1,
            limit: 100,
            totalItems: 1,
            totalPages: 1,
          },
        },
      });
    }

    if (pathname === '/api/admin/users' && method === 'GET') {
      const search = url.searchParams.get('search')?.toLowerCase();
      const users = withAdminData
        ? mockAdminUsers.filter((candidate) =>
            !search
              ? true
              : [candidate.email, candidate.firstName, candidate.lastName, candidate.phone || '']
                  .join(' ')
                  .toLowerCase()
                  .includes(search)
          )
        : [];

      return fulfillJson(route, {
        success: true,
        data: {
          users,
          pagination: {
            page: 1,
            pageSize: 25,
            total: users.length,
            totalPages: 1,
          },
        },
      });
    }

    if (pathname === '/api/admin/users/user-100' && method === 'GET') {
      return fulfillJson(route, {
        success: true,
        data: withAdminData ? mockAdminDetail : null,
      });
    }

    if (pathname === '/api/admin/users/user-100' && method === 'PATCH') {
      return fulfillJson(route, {
        success: true,
        data: {
          user: {
            ...mockAdminDetail.user,
            updatedAt: new Date().toISOString(),
          },
        },
      });
    }

    if (pathname === '/api/admin/users/user-100/password' && method === 'POST') {
      return fulfillJson(route, {
        success: true,
        data: {
          success: true,
          revokedSessions: 2,
        },
      });
    }

    if (pathname === '/api/admin/users/user-100/revoke-sessions' && method === 'POST') {
      return fulfillJson(route, {
        success: true,
        data: {
          success: true,
          revokedSessions: 2,
        },
      });
    }

    return fulfillJson(route, {
      success: true,
      data: {},
    });
  });
};

const bootstrapSession = async (page: Page, user: typeof freeUser) => {
  await page.goto('/login');
  await page.evaluate((authUser) => {
    localStorage.setItem(
      'auth-storage',
      JSON.stringify({
        state: {
          user: authUser,
          refreshToken: 'presentation-refresh-token',
        },
        version: 0,
      })
    );
  }, user);

  await page.reload({ waitUntil: 'networkidle' });
};

test.describe('Presentation screenshot capture', () => {
  test.describe.configure({ mode: 'serial' });

  test('captures desktop journey screenshots', async ({ page }) => {
    test.setTimeout(180000);
    test.skip(test.info().project.name !== 'chromium', 'Desktop capture runs only on chromium.');

    await page.setViewportSize({ width: 1440, height: 1024 });
    await installApiMocks(page, freeUser, false);

    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await takeShot(page, 'desktop', '01-login');

    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
    await takeShot(page, 'desktop', '02-signup');

    await bootstrapSession(page, freeUser);

    await page.goto('/dashboard/analysis');
    await expect(page.getByText(/ATS Resume Analyzer/i)).toBeVisible();
    await takeShot(page, 'desktop', '03-dashboard-analysis');

    await page.getByLabel('Open settings').click();
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
    await takeShot(page, 'desktop', '04-dashboard-settings-panel');

    await page.getByLabel('Toggle AI model selection').click();
    await page.getByLabel('Close settings').click();
    await expect(page.getByText(/AI Model Selection/i)).toBeVisible();
    await takeShot(page, 'desktop', '05-dashboard-analysis-model-selector');

    await page.goto('/dashboard/resumes');
    await expect(page.getByRole('heading', { name: /my resumes/i })).toBeVisible();
    await takeShot(page, 'desktop', '06-resume-list');

    await page
      .getByRole('button')
      .filter({ hasText: /Senior Frontend Engineer Resume/i })
      .first()
      .click();
    await expect(page.getByText(/Resume Analysis/i)).toBeVisible();
    await takeShot(page, 'desktop', '07-resume-detail');

    await page.getByRole('button', { name: /^Edit$/i }).first().click();
    await expect(page.getByRole('heading', { name: /Edit Resume/i })).toBeVisible();
    await takeShot(page, 'desktop', '08-resume-form-edit');

    await page.getByRole('button', { name: /^Preview Resume$/i }).first().click();
    await expect(page.getByRole('heading', { name: /Resume Preview/i })).toBeVisible();
    await takeShot(page, 'desktop', '09-resume-preview-modal');

    await page.getByLabel(/Close preview/i).click();
    await page.getByLabel(/close form/i).click();

    await page.getByRole('button', { name: /Create New Resume/i }).first().click();
    await expect(page.getByRole('heading', { name: /Create New Resume/i })).toBeVisible();
    await takeShot(page, 'desktop', '10-resume-form-create');

    await page.getByRole('button', { name: /^Cancel$/i }).first().click();

    await page.goto('/dashboard/history');
    await expect(page.getByRole('heading', { name: /Analysis History/i })).toBeVisible();
    await takeShot(page, 'desktop', '11-history-dashboard');

    await page.getByRole('button', { name: /Add Job Description/i }).click();
    await expect(page.getByRole('heading', { name: /Create New Job Description/i })).toBeVisible();
    await takeShot(page, 'desktop', '12-job-description-form');

    await page.goto('/analysis/analysis-001');
    await expect(page.getByRole('heading', { name: /Analysis Results/i })).toBeVisible();
    await takeShot(page, 'desktop', '13-analysis-results');

    await page.unroute('**/api/**');
    await installApiMocks(page, adminUser, true);
    await bootstrapSession(page, adminUser);

    await page.goto('/dashboard/analysis');
    await expect(page.getByRole('link', { name: /Open Admin Console/i })).toBeVisible();
    await takeShot(page, 'desktop', '14-dashboard-admin-entry');

    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: /User Operations/i })).toBeVisible();
    await takeShot(page, 'desktop', '15-admin-console');

    await page.getByLabel(/search users/i).fill('candidate.one');
    await expect(page.getByText(/candidate.one@example.com/i)).toBeVisible();
    await takeShot(page, 'desktop', '16-admin-search-filtered');
  });

  test('captures key mobile screenshots', async ({ page }) => {
    test.setTimeout(120000);
    test.skip(test.info().project.name !== 'Mobile Chrome', 'Mobile capture runs only on Mobile Chrome.');

    await page.setViewportSize({ width: 390, height: 844 });
    await installApiMocks(page, freeUser, false);

    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await takeShot(page, 'mobile', '01-login-mobile');

    await bootstrapSession(page, freeUser);

    await page.goto('/dashboard/analysis');
    await expect(page.getByText(/ATS Resume Analyzer/i)).toBeVisible();
    await takeShot(page, 'mobile', '02-dashboard-analysis-mobile');

    await page.goto('/dashboard/resumes');
    await expect(page.getByRole('heading', { name: /my resumes/i })).toBeVisible();
    await takeShot(page, 'mobile', '03-resume-list-mobile');

    await page.goto('/analysis/analysis-001');
    await expect(page.getByRole('heading', { name: /Analysis Results/i })).toBeVisible();
    await takeShot(page, 'mobile', '04-analysis-results-mobile');

    await page.unroute('**/api/**');
    await installApiMocks(page, adminUser, true);
    await bootstrapSession(page, adminUser);

    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: /User Operations/i })).toBeVisible();
    await takeShot(page, 'mobile', '05-admin-console-mobile');
  });
});
