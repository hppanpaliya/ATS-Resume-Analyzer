# Representative Code Snippets (Backend + Frontend)

This document contains presentation-friendly excerpts from the current codebase, with concise interpretation.

---

## Backend snippets

### 1) Server bootstrapping, CORS, and layered middleware

**File:** `ats-backend/src/index.ts`

```ts
const requiredEnvVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);
if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

app.use(requestContextMiddleware);
app.use(cors(corsOptions));
app.use(globalLimiter);
app.use(express.json({ limit: '1mb' }));

app.use('/api/auth', authLimiter);
app.use('/api/analyze', analyzeLimiter);
app.use('/api/admin', adminLimiter);
```

**Why it matters:** startup fails fast on missing secrets and applies layered protections before hitting routes.

---

### 2) JWT guard with user existence check

**File:** `ats-backend/src/middleware/auth.middleware.ts`

```ts
const token = authHeader.substring(7);
const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

const user = await prisma.user.findUnique({
  where: { id: decoded.userId },
  select: { id: true, deletedAt: true },
});

if (!user || user.deletedAt) {
  return res.status(401).json({ error: 'User not found' });
}
```

**Why it matters:** token validity alone is insufficient; account state is also verified.

---

### 3) Tier-aware per-user rate limiter

**File:** `ats-backend/src/middleware/rate-limiter.middleware.ts`

```ts
const limitStatus = rateLimiter.checkLimit(
  req.userId,
  limitKey,
  user.subscriptionTier
);

res.setHeader('X-RateLimit-Limit', limitStatus.limit);
res.setHeader('X-RateLimit-Remaining', limitStatus.remaining);

if (!limitStatus.allowed) {
  const retryAfter = formatResetTime(limitStatus.resetAt);
  res.setHeader('Retry-After', retryAfter);
  return res.status(429).json({
    success: false,
    error: 'Rate limit exceeded',
  });
}
```

**Why it matters:** limits are user-tier-sensitive and API responses include machine-readable backoff metadata.

---

### 4) Structured global error handling

**File:** `ats-backend/src/middleware/error.middleware.ts`

```ts
if (err instanceof AppError) {
  const response = {
    success: false,
    error: {
      code: err.code,
      message: err.getClientMessage(),
      timestamp: err.timestamp.toISOString(),
      ...(requestId && { requestId }),
    },
  };
  return res.status(err.statusCode).json(response);
}
```

**Why it matters:** keeps client error contracts stable and debuggable.

---

### 5) Async analysis queue contract

**File:** `ats-backend/src/queues/analysis.queue.ts`

```ts
export interface AnalysisJobData {
  userId: string;
  resumeText: string;
  jobDescription: string;
  jobTitle: string;
  selectedModel?: string;
  temperature?: number;
  max_tokens?: number;
  include_reasoning?: boolean;
}

export interface AnalysisJobResult {
  analysisId: string;
  resumeId: string;
  jobDescriptionId: string;
  overallScore?: number;
  status: 'completed' | 'failed';
}
```

**Why it matters:** explicit queue payload/result contracts improve maintainability and testability.

---

### 6) Job processor with progress checkpoints and transactional persistence

**File:** `ats-backend/src/jobs/analyze-resume.job.ts`

```ts
job.progress(30);
const analysisResult = await aiService.analyzeResume(
  text,
  jobDescription,
  selectedModel,
  modelParameters
);

const savedData = await prisma.$transaction(async (tx) => {
  const resume = await tx.resume.create({ data: { userId, title: `Resume for ${jobTitle}`, extractedText: text, status: 'analyzed' } });
  const analysis = await tx.analysis.create({
    data: {
      userId,
      resumeId: resume.id,
      analysisType: 'ats_analysis',
      results: JSON.stringify(analysisResult),
      status: 'completed',
    },
  });
  return { resume, analysis };
});
```

**Why it matters:** UX progress updates and DB atomicity are handled together.

---

### 7) Analysis route queues work and returns 202

**File:** `ats-backend/src/routes/analysis.routes.ts`

```ts
const job = await queueAnalysisJob({
  userId: req.userId!,
  resumeText: '',
  jobDescription,
  jobTitle,
  fileBuffer: req.file.buffer,
  fileName: req.file.originalname,
  fileMimeType: req.file.mimetype,
  selectedModel,
  temperature,
  max_tokens: maxTokens,
});

res.status(202).json({
  success: true,
  message: 'Analysis queued successfully',
  data: { jobId: job.id, status: 'queued' },
});
```

**Why it matters:** API avoids request timeout risk by decoupling submission from completion.

---

### 8) AI service model fallback + prompt execution

**File:** `ats-backend/src/services/ai.service.ts`

```ts
const AI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;

const completionParams: CompletionParameters = {
  model,
  messages: [{ role: 'user', content: prompt }],
  temperature: modelParameters?.temperature ?? 0.15,
  max_tokens: Math.min(modelParameters?.max_tokens ?? 4000, 16000),
  seed: 42,
};

const completion = await getOpenAIClient().chat.completions.create(completionParams as any);
```

**Why it matters:** supports OpenRouter-first usage with practical parameterization.

---

### 9) Refresh session rotation and reuse defense

**File:** `ats-backend/src/services/auth.service.ts`

```ts
if (currentSession.revokedAt) {
  await this.revokeAllRefreshSessions(currentSession.userId);
  throw new AuthenticationError('Refresh token reuse detected');
}

const newSession = await this.createRefreshSession(user.id);
await prisma.refreshSession.update({
  where: { id: currentSession.id },
  data: {
    revokedAt: new Date(),
    replacedBySessionId: newSession.sessionId,
    lastUsedAt: new Date(),
  },
});
```

**Why it matters:** explicit session lifecycle hardens auth hygiene.

---

### 10) Admin route composition

**File:** `ats-backend/src/routes/admin.routes.ts`

```ts
router.use(authMiddleware, adminMiddleware);

router.get('/users', async (req: AdminRequest, res: Response) => {
  const result = await adminService.listUsers({
    search: typeof req.query.search === 'string' ? req.query.search : undefined,
    page: req.query.page ? Number(req.query.page) : undefined,
    pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
  });
  return res.json({ success: true, data: result });
});
```

**Why it matters:** admin endpoints are consistently protected and typed.

---

## Frontend snippets

### 11) Route-level protection with admin gating

**File:** `ats-frontend/src/App.jsx`

```jsx
<Route
  path="/admin"
  element={
    <ProtectedRoute requireAdmin>
      <AdminPage />
    </ProtectedRoute>
  }
/>
```

**Why it matters:** frontend route gating aligns with backend role checks.

---

### 12) Protected route hydration + redirect policy

**File:** `ats-frontend/src/components/ProtectedRoute.jsx`

```jsx
if (!hasHydrated) {
  return <LoadingSpinner label="Loading session..." />;
}

if (!isAuthenticated || !hasSessionToken) {
  return <Navigate to="/login" replace state={{ from: location }} />;
}

if (requireAdmin && user?.subscriptionTier !== 'admin') {
  return <Navigate to="/dashboard/analysis" replace state={{ from: location }} />;
}
```

**Why it matters:** prevents pre-hydration flicker and enforces role-aware navigation.

---

### 13) Persisted auth store with hydration callback

**File:** `ats-frontend/src/stores/authStore.js`

```js
partialize: (state) => ({
  user: state.user,
  refreshToken: state.refreshToken,
}),
onRehydrateStorage: () => (state) => {
  if (!state?.refreshToken) {
    state?.clearAuth();
  } else {
    state?.setAuth(state.user, null, state.refreshToken);
  }
  state?.setHasHydrated(true);
},
```

**Why it matters:** persistence keeps sessions practical while avoiding stale access token reuse.

---

### 14) Axios refresh de-duplication pattern

**File:** `ats-frontend/src/services/api.js`

```js
if (!refreshPromise) {
  refreshPromise = requestTokenRefresh(refreshToken);
}

const response = await refreshPromise;
const tokens = response?.data?.data?.tokens;

useAuthStore.getState().setAuth(
  useAuthStore.getState().user,
  tokens.accessToken,
  tokens.refreshToken
);
```

**Why it matters:** avoids multiple simultaneous refresh requests under token expiry races.

---

### 15) Async analysis flow from UI perspective

**File:** `ats-frontend/src/pages/AnalysisDashboard.jsx`

```jsx
const result = await analyzeResume(
  resumeFile,
  jobDescription,
  showModelSelector ? selectedModel : null,
  modelParameters,
  jobTitle
);

if (result?.jobId) {
  const completedJob = await waitForAnalysisCompletion(result.jobId);
  const analysisId = completedJob.result?.savedAnalysisId;
  resolvedAnalysis = await getAnalysisById(analysisId);
}

navigate(`/analysis/${resolvedAnalysis.savedAnalysisId || resolvedAnalysis.id || 'new'}`);
```

**Why it matters:** clean queue/poll/result handoff with canonical deep-link route.

---

### 16) Admin UI operational controls

**File:** `ats-frontend/src/pages/AdminPage.jsx`

```jsx
const result = await adminService.setUserPassword(selectedUserId, newPassword);
setSuccessMessage(`Password updated and ${result.revokedSessions} session(s) revoked.`);

const revokeResult = await adminService.revokeUserSessions(selectedUserId);
setSuccessMessage(`${revokeResult.revokedSessions} active session(s) revoked.`);
```

**Why it matters:** high-impact admin actions are surfaced with explicit feedback.

---

## How to present these snippets

- Start with backend contracts and trust boundaries.
- Then show frontend resilience patterns.
- Finish with admin capabilities and explain operational value.
- Keep each snippet to: intent → mechanism → trade-off.
