import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, existsSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotRoot = path.resolve(__dirname, '../../../docs/presentation/screenshots');
const videoRoot = path.resolve(__dirname, '../../../docs/presentation/videos');

type ThemeMode = 'light' | 'dark';
type DeviceMode = 'desktop' | 'mobile';

const freeUser = {
  id: 'tour-user-1',
  email: 'tour.user@example.com',
  firstName: 'Tour',
  lastName: 'User',
  subscriptionTier: 'free',
};

const adminUser = {
  id: 'tour-admin-1',
  email: 'tour.admin@example.com',
  firstName: 'Tour',
  lastName: 'Admin',
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
  content: `PRATIK SHAH
Senior Frontend Engineer

EXPERIENCE
- Led migration from legacy UI to React + TypeScript micro-frontends
- Improved Core Web Vitals by 38% across customer portal
- Built reusable design system used by 4 product teams

SKILLS
React, TypeScript, Node.js, Accessibility, Testing, CI/CD

EDUCATION
M.Sc. Computer Science`,
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
      userId: 'tour-admin-1',
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

const ensureOutputFolder = (theme: ThemeMode, device: DeviceMode) => {
  const dirPath = path.join(screenshotRoot, theme, device);
  mkdirSync(dirPath, { recursive: true });
  return dirPath;
};

const ensureVideoFolder = () => {
  mkdirSync(videoRoot, { recursive: true });
  return videoRoot;
};

const pauseForTour = async (page: Page, ms = 700) => {
  await page.waitForTimeout(ms);
};

const closeSettingsPanel = async (page: Page) => {
  const closeButton = page.getByLabel('Close settings');
  await expect(closeButton).toBeVisible();
  await pauseForTour(page, 250);
  await closeButton.click({ force: true });
};

const saveTourVideo = async (page: Page, fileName: string) => {
  const dir = ensureVideoFolder();
  const video = page.video();
  const targetPath = path.join(dir, `${fileName}.webm`);

  await page.context().close();

  if (!video) {
    throw new Error('Video recording is unavailable. Ensure test.use({ video: "on" }) is enabled.');
  }

  await video.saveAs(targetPath);

  try {
    const rawPath = await video.path();
    if (rawPath && rawPath !== targetPath && existsSync(rawPath)) {
      unlinkSync(rawPath);
    }
  } catch {
    // Ignore cleanup errors to keep capture resilient.
  }
};

const installTheme = async (page: Page, theme: ThemeMode) => {
  await page.addInitScript((nextTheme) => {
    window.localStorage.setItem('theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  }, theme);
};

const takeShot = async (
  page: Page,
  theme: ThemeMode,
  device: DeviceMode,
  name: string,
  options: { fullPage?: boolean } = {}
) => {
  const outDir = ensureOutputFolder(theme, device);
  await expect(page.locator('body')).toBeVisible();
  await page.waitForTimeout(250);
  await page.screenshot({
    path: path.join(outDir, `${name}.png`),
    fullPage: options.fullPage ?? true,
    animations: 'disabled',
  });
};

const fulfillJson = async (
  route: Parameters<Page['route']>[1] extends (...args: infer T) => unknown ? T[0] : never,
  body: unknown,
  status = 200
) => {
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

    if (pathname === '/api/analyze' && method === 'POST') {
      return fulfillJson(route, {
        success: true,
        data: {
          jobId: 'job-tour-001',
          status: 'queued',
        },
      }, 202);
    }

    if (pathname.startsWith('/api/analysis/') && pathname.endsWith('/status') && method === 'GET') {
      return fulfillJson(route, {
        success: true,
        data: {
          state: 'completed',
          progress: 100,
          result: {
            savedAnalysisId: 'analysis-001',
            analysisId: 'analysis-001',
          },
        },
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

    if (pathname === '/api/resumes/resume-001/analyze' && method === 'POST') {
      return fulfillJson(route, {
        success: true,
        data: {
          id: 'analysis-001',
          savedAnalysisId: 'analysis-001',
        },
      });
    }

    if (pathname === '/api/resumes/preview' && method === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<!doctype html><html><body><h1 style="font-family:Arial">Resume Preview</h1><p>Preview generated for tour screenshots.</p></body></html>',
      });
    }

    if (pathname === '/api/resumes/resume-001/file' && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: '%PDF-1.4 mock original file',
      });
    }

    if (pathname === '/api/resumes/resume-001/export/pdf' && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: '%PDF-1.4 mock export pdf',
      });
    }

    if (pathname === '/api/resumes/resume-001/export/word' && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        body: 'PK\u0003\u0004mock-docx',
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

    if (pathname === '/api/job-descriptions' && method === 'POST') {
      return fulfillJson(route, {
        success: true,
        data: {
          id: 'job-002',
          title: 'Principal Frontend Engineer',
          description:
            'Lead frontend platform architecture, mentor teams, and own performance outcomes across product surfaces.',
          createdAt: '2026-03-05T08:00:00.000Z',
          updatedAt: '2026-03-05T08:00:00.000Z',
        },
      }, 201);
    }

    if (pathname.startsWith('/api/job-descriptions/') && method === 'PUT') {
      return fulfillJson(route, {
        success: true,
        data: {
          id: pathname.split('/').pop(),
          title: 'Principal Frontend Engineer (Updated)',
          description:
            'Updated job description focused on architecture, mentoring, and measurable delivery impact.',
          createdAt: '2026-03-05T08:00:00.000Z',
          updatedAt: '2026-03-05T08:10:00.000Z',
        },
      });
    }

    if (pathname.startsWith('/api/job-descriptions/') && method === 'DELETE') {
      return fulfillJson(route, {
        success: true,
        data: { deleted: true },
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
          refreshToken: 'tour-refresh-token',
        },
        version: 0,
      })
    );
  }, user);

  await page.reload({ waitUntil: 'networkidle' });
};

const runUserDesktopVideoTour = async (page: Page, theme: ThemeMode = 'light') => {
  await page.setViewportSize({ width: 1440, height: 1024 });
  await installTheme(page, theme);
  await installApiMocks(page, freeUser, false);

  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  await pauseForTour(page);

  await page.goto('/signup');
  await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
  await pauseForTour(page);

  await bootstrapSession(page, freeUser);

  await page.goto('/dashboard/analysis');
  await expect(page.getByText(/ATS Resume Analyzer/i)).toBeVisible();
  await pauseForTour(page);

  await page.getByLabel('Open settings').click();
  await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
  await pauseForTour(page);

  await page.getByLabel('Toggle AI model selection').click();
  await closeSettingsPanel(page);
  await expect(page.getByText(/AI Model Selection/i)).toBeVisible();
  await pauseForTour(page);

  await page.getByRole('button', { name: /show models/i }).click();
  await expect(page.getByRole('button', { name: /OpenRouter Free/i }).first()).toBeVisible();
  await pauseForTour(page);

  await page.setInputFiles('#resume-upload', {
    name: 'tour-resume.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 mock resume content'),
  });
  await page
    .getByPlaceholder(/Paste the complete job description here/i)
    .fill('We need a Senior Frontend Engineer with React, TypeScript, accessibility, performance optimization, and cross-team collaboration.');
  await pauseForTour(page);

  await expect(page.getByRole('button', { name: /Analyze Resume/i }).first()).toBeEnabled();
  await page.getByRole('button', { name: /Analyze Resume/i }).first().click();
  await expect(page).toHaveURL(/\/analysis\/analysis-001/);
  await expect(page.getByRole('heading', { name: /Analysis Results/i })).toBeVisible();
  await pauseForTour(page, 900);

  await page.getByRole('button', { name: /Back to Dashboard/i }).first().click();
  await expect(page).toHaveURL(/\/dashboard/);
  await pauseForTour(page, 500);

  await page.goto('/dashboard/resumes');
  await expect(page.getByRole('heading', { name: /my resumes/i })).toBeVisible();
  await pauseForTour(page);

  await page
    .getByRole('button')
    .filter({ hasText: /Senior Frontend Engineer Resume/i })
    .first()
    .click();
  await expect(page.getByText(/Resume Analysis/i)).toBeVisible();
  await pauseForTour(page);

  await page.getByRole('button', { name: /^Original$/i }).click();
  await pauseForTour(page, 350);
  await page.getByRole('button', { name: /^PDF$/i }).click();
  await pauseForTour(page, 350);
  await page.getByRole('button', { name: /^Word$/i }).click();
  await pauseForTour(page, 350);

  await page.locator('#jobDescription').fill(
    'Seeking a senior engineer who can lead frontend architecture, mentor teammates, and improve Core Web Vitals.'
  );
  await page.getByRole('button', { name: /Analyze Resume Match/i }).click();
  await expect(page).toHaveURL(/\/analysis\/analysis-001/);
  await pauseForTour(page, 800);

  await page.getByRole('button', { name: /Back to Dashboard/i }).first().click();
  await page.goto('/dashboard/resumes');
  await page
    .getByRole('button')
    .filter({ hasText: /Senior Frontend Engineer Resume/i })
    .first()
    .click();
  await expect(page.getByText(/Resume Analysis/i)).toBeVisible();
  await pauseForTour(page, 300);

  await page.getByRole('button', { name: /^Edit$/i }).first().click();
  await expect(page.getByRole('heading', { name: /Edit Resume/i })).toBeVisible();
  await pauseForTour(page);

  await page.getByRole('button', { name: /^Preview Resume$/i }).first().click();
  await expect(page.getByRole('heading', { name: /Resume Preview/i })).toBeVisible();
  await pauseForTour(page);

  await page.getByLabel(/Close preview/i).click();
  await pauseForTour(page, 400);

  await page.getByLabel(/close form/i).click();
  await pauseForTour(page, 400);

  await page.getByRole('button', { name: /Create New Resume/i }).first().click();
  await expect(page.getByRole('heading', { name: /Create New Resume/i })).toBeVisible();
  await pauseForTour(page);

  await page.getByRole('button', { name: /^Cancel$/i }).first().click();
  await pauseForTour(page, 400);

  await page.goto('/dashboard/history');
  await expect(page.getByRole('heading', { name: /Analysis History/i })).toBeVisible();
  await pauseForTour(page);

  await page.getByRole('button').filter({ hasText: /Senior Frontend Engineer/i }).first().click();
  await expect(page).toHaveURL(/\/analysis\/analysis-001/);
  await pauseForTour(page, 800);
  await page.getByRole('button', { name: /Back to Dashboard/i }).first().click();
  await page.goto('/dashboard/history');
  await expect(page.getByRole('heading', { name: /Analysis History/i })).toBeVisible();
  await pauseForTour(page, 400);

  await page.getByRole('button', { name: /Add Job Description/i }).click();
  await expect(page.getByRole('heading', { name: /Create New Job Description|Edit Job Description/i })).toBeVisible();
  await pauseForTour(page);

  await page.locator('#job-title').fill('Senior Frontend Engineer - Platform');
  await page.locator('#job-description').fill(
    'We are hiring a Senior Frontend Engineer with strong React and TypeScript experience and platform architecture ownership.'
  );
  await page.getByRole('button', { name: /^Create$/i }).click();
  await pauseForTour(page);

  await page.getByLabel(/Edit job description/i).first().click();
  await expect(page.getByRole('heading', { name: /Edit Job Description/i })).toBeVisible();
  await page.locator('#job-title').fill('Senior Frontend Engineer - Platform (Updated)');
  await page.getByRole('button', { name: /^Update$/i }).click();
  await pauseForTour(page);

  page.once('dialog', async (dialog) => {
    await dialog.accept();
  });
  await page.getByLabel(/Delete job description/i).first().click();
  await pauseForTour(page);

  await page.goto('/analysis/analysis-001');
  await expect(page.getByRole('heading', { name: /Analysis Results/i })).toBeVisible();
  await pauseForTour(page, 900);

  await page.goto('/dashboard/analysis');
  await page.getByRole('button', { name: /logout/i }).click();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  await pauseForTour(page, 700);
};

const runAdminDesktopVideoTour = async (page: Page, theme: ThemeMode = 'light') => {
  await page.setViewportSize({ width: 1440, height: 1024 });
  await installTheme(page, theme);
  await installApiMocks(page, adminUser, true);
  await bootstrapSession(page, adminUser);

  await page.goto('/dashboard/analysis');
  await expect(page.getByRole('link', { name: /Open Admin Console/i })).toBeVisible();
  await pauseForTour(page);

  await page.getByRole('link', { name: /Open Admin Console/i }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('heading', { name: /User Operations/i })).toBeVisible();
  await pauseForTour(page);

  await page.getByLabel(/search users/i).fill('candidate.one');
  await expect(page.getByText(/candidate.one@example.com/i)).toBeVisible();
  await pauseForTour(page);

  const targetCard = page.getByRole('button').filter({ hasText: /candidate.one@example.com/i }).first();
  await targetCard.click();
  await expect(page.getByRole('heading', { name: /candidate.one@example.com/i })).toBeVisible();
  await pauseForTour(page);

  await page.getByLabel(/first name/i).fill('Candidate');
  await page.getByLabel(/last name/i).fill('One Updated');
  await page.getByLabel(/subscription tier/i).selectOption('pro');
  await page.getByRole('button', { name: /save changes/i }).click();
  await expect(page.getByText(/user profile updated/i)).toBeVisible();
  await pauseForTour(page);

  await page.getByLabel(/new password/i).fill('TempPassword123!');
  await page.getByRole('button', { name: /set new password/i }).click();
  await expect(page.getByText(/password updated and/i)).toBeVisible();
  await pauseForTour(page);

  await page.getByRole('button', { name: /revoke all sessions/i }).click();
  await expect(page.getByText(/active session\(s\) revoked/i)).toBeVisible();

  const auditTrailHeading = page.getByRole('heading', { name: /audit trail/i });
  await auditTrailHeading.scrollIntoViewIfNeeded();
  await expect(auditTrailHeading).toBeVisible();
  await pauseForTour(page, 1000);

  await page.getByRole('link', { name: /Back To Dashboard/i }).click();
  await expect(page).toHaveURL(/\/dashboard\/analysis/);
  await pauseForTour(page, 600);
};

const captureDesktopJourney = async (page: Page, theme: ThemeMode) => {
  await page.setViewportSize({ width: 1440, height: 1024 });
  await installTheme(page, theme);
  await installApiMocks(page, freeUser, false);

  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  await takeShot(page, theme, 'desktop', '01-login');

  await page.goto('/signup');
  await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
  await takeShot(page, theme, 'desktop', '02-signup');

  await bootstrapSession(page, freeUser);

  await page.goto('/dashboard/analysis');
  await expect(page.getByText(/ATS Resume Analyzer/i)).toBeVisible();
  await takeShot(page, theme, 'desktop', '03-dashboard-analysis');

  await page.getByLabel('Open settings').click();
  await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
  await takeShot(page, theme, 'desktop', '04-settings-panel');

  await page.getByLabel('Toggle AI model selection').click();
  await closeSettingsPanel(page);
  await expect(page.getByText(/AI Model Selection/i)).toBeVisible();
  await takeShot(page, theme, 'desktop', '05-model-selector');

  await page.getByRole('button', { name: /show models/i }).click();
  await expect(page.getByRole('button', { name: /OpenRouter Free/i }).first()).toBeVisible();
  await takeShot(page, theme, 'desktop', '06-model-selector-expanded');

  await page.goto('/dashboard/resumes');
  await expect(page.getByRole('heading', { name: /my resumes/i })).toBeVisible();
  await takeShot(page, theme, 'desktop', '07-resume-list');

  await page
    .getByRole('button')
    .filter({ hasText: /Senior Frontend Engineer Resume/i })
    .first()
    .click();
  await expect(page.getByText(/Resume Analysis/i)).toBeVisible();
  await takeShot(page, theme, 'desktop', '08-resume-detail');

  await page.getByRole('button', { name: /^Edit$/i }).first().click();
  await expect(page.getByRole('heading', { name: /Edit Resume/i })).toBeVisible();
  await takeShot(page, theme, 'desktop', '09-resume-form-edit');

  await page.getByRole('button', { name: /^Preview Resume$/i }).first().click();
  await expect(page.getByRole('heading', { name: /Resume Preview/i })).toBeVisible();
  await takeShot(page, theme, 'desktop', '10-resume-preview-modal');

  await page.getByLabel(/Close preview/i).click();
  await page.getByLabel(/close form/i).click();

  await page.getByRole('button', { name: /Create New Resume/i }).first().click();
  await expect(page.getByRole('heading', { name: /Create New Resume/i })).toBeVisible();
  await takeShot(page, theme, 'desktop', '11-resume-form-create');
  await page.getByRole('button', { name: /^Cancel$/i }).first().click();

  await page.goto('/dashboard/history');
  await expect(page.getByRole('heading', { name: /Analysis History/i })).toBeVisible();
  await takeShot(page, theme, 'desktop', '12-history-dashboard');

  await page.getByRole('button', { name: /Add Job Description/i }).click();
  await expect(page.getByRole('heading', { name: /Create New Job Description|Edit Job Description/i })).toBeVisible();
  await takeShot(page, theme, 'desktop', '13-job-description-form');

  await page.goto('/analysis/analysis-001');
  await expect(page.getByRole('heading', { name: /Analysis Results/i })).toBeVisible();
  await takeShot(page, theme, 'desktop', '14-analysis-results');

  await page.unroute('**/api/**');
  await installApiMocks(page, adminUser, true);
  await bootstrapSession(page, adminUser);

  await page.goto('/dashboard/analysis');
  await expect(page.getByRole('link', { name: /Open Admin Console/i })).toBeVisible();
  await takeShot(page, theme, 'desktop', '15-dashboard-admin-entry');

  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: /User Operations/i })).toBeVisible();
  await takeShot(page, theme, 'desktop', '16-admin-console');

  await page.getByLabel(/search users/i).fill('candidate.one');
  await expect(page.getByText(/candidate.one@example.com/i)).toBeVisible();
  await takeShot(page, theme, 'desktop', '17-admin-search-filtered');

  const targetCard = page.getByRole('button').filter({ hasText: /candidate.one@example.com/i }).first();
  await targetCard.click();
  await expect(page.getByRole('heading', { name: /candidate.one@example.com/i })).toBeVisible();
  await takeShot(page, theme, 'desktop', '18-admin-user-detail');

  const auditTrailHeading = page.getByRole('heading', { name: /audit trail/i });
  await auditTrailHeading.scrollIntoViewIfNeeded();
  await expect(auditTrailHeading).toBeVisible();
  await takeShot(page, theme, 'desktop', '19-admin-audit-trail', { fullPage: false });
};

const captureMobileJourney = async (page: Page, theme: ThemeMode) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installTheme(page, theme);
  await installApiMocks(page, freeUser, false);

  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  await takeShot(page, theme, 'mobile', '01-login-mobile');

  await bootstrapSession(page, freeUser);

  await page.goto('/dashboard/analysis');
  await expect(page.getByText(/ATS Resume Analyzer/i)).toBeVisible();
  await takeShot(page, theme, 'mobile', '02-dashboard-analysis-mobile');

  await page.goto('/dashboard/resumes');
  await expect(page.getByRole('heading', { name: /my resumes/i })).toBeVisible();
  await takeShot(page, theme, 'mobile', '03-resume-list-mobile');

  await page.goto('/dashboard/history');
  await expect(page.getByRole('heading', { name: /Analysis History/i })).toBeVisible();
  await takeShot(page, theme, 'mobile', '04-history-dashboard-mobile');

  await page.goto('/analysis/analysis-001');
  await expect(page.getByRole('heading', { name: /Analysis Results/i })).toBeVisible();
  await takeShot(page, theme, 'mobile', '05-analysis-results-mobile');

  await page.unroute('**/api/**');
  await installApiMocks(page, adminUser, true);
  await bootstrapSession(page, adminUser);

  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: /User Operations/i })).toBeVisible();
  await takeShot(page, theme, 'mobile', '06-admin-console-mobile');
};

test.describe('@tour presentation screenshot capture', () => {
  test.describe.configure({ mode: 'serial' });

  for (const theme of ['light', 'dark'] as const) {
    test(`@tour captures desktop presentation journey (${theme})`, async ({ page }) => {
      test.setTimeout(180000);
      test.skip(test.info().project.name !== 'chromium', 'Desktop tour capture runs only on chromium.');
      await captureDesktopJourney(page, theme);
    });

    test(`@tour captures mobile presentation journey (${theme})`, async ({ page }) => {
      test.setTimeout(120000);
      test.skip(test.info().project.name !== 'Mobile Chrome', 'Mobile tour capture runs only on Mobile Chrome.');
      await captureMobileJourney(page, theme);
    });
  }
});

test.describe('@tour-video end-to-end video capture', () => {
  test.describe.configure({ mode: 'serial' });

  for (const theme of ['light', 'dark'] as const) {
    test(`@tour-video captures complete user feature tour (desktop, ${theme})`, async ({ browser }) => {
      test.setTimeout(240000);
      test.skip(test.info().project.name !== 'chromium', 'User video tour runs only on chromium.');

      const context = await browser.newContext({
        baseURL: 'http://127.0.0.1:4010',
        recordVideo: {
          dir: ensureVideoFolder(),
          size: { width: 1440, height: 1024 },
        },
      });
      const page = await context.newPage();

      await runUserDesktopVideoTour(page, theme);
      await saveTourVideo(page, `tour-user-desktop-${theme}`);
    });

    test(`@tour-video captures complete admin feature tour (desktop, ${theme})`, async ({ browser }) => {
      test.setTimeout(180000);
      test.skip(test.info().project.name !== 'chromium', 'Admin video tour runs only on chromium.');

      const context = await browser.newContext({
        baseURL: 'http://127.0.0.1:4010',
        recordVideo: {
          dir: ensureVideoFolder(),
          size: { width: 1440, height: 1024 },
        },
      });
      const page = await context.newPage();

      await runAdminDesktopVideoTour(page, theme);
      await saveTourVideo(page, `tour-admin-desktop-${theme}`);
    });
  }
});
