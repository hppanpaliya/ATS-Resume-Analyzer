# Visual, User Workflow, and Admin Workflow Testing Guide

This guide documents the added test coverage for:

- **Visual vision checks** (UI render evidence)
- **End-to-end user workflow** (authenticated dashboard flow → resume flow → history/job-description flow → logout)
- **Admin workflow behavior** (admin-only API authorization and execution)

---

## What was added

### 1) Visual vision E2E coverage

File: `ats-frontend/tests/e2e/visual-vision.spec.ts`

Coverage includes:

- Public auth screens visual capture:
  - `/login`
  - `/signup`
- Authenticated dashboard visual capture:
  - `/dashboard/analysis`
  - `/dashboard/resumes`
  - `/dashboard/history`
- For authenticated screens, tests bootstrap a deterministic authenticated state and attach screenshots as artifacts.
- Each screenshot is validated as non-empty image output.

### 2) Full user workflow E2E coverage

File: `ats-frontend/tests/e2e/user-workflow.spec.ts`

Coverage includes:

1. Bootstrap authenticated session state
2. Resume creation from text content
3. Resume detail view navigation
4. Job description creation in history manager
5. Analysis entry-point visibility check
6. Logout and redirect back to login

Implementation note:

- The user workflow suite mocks API responses for deterministic UI flow validation and reduced flakiness.

### 3) Admin workflow integration coverage

File: `ats-frontend/tests/integration/admin-workflow.spec.ts`

Coverage includes:

- **Regular authenticated user** is denied on admin endpoints (`403` expected, `429` tolerated under limiter pressure):
  - `POST /api/templates/seed`
  - `GET /api/queue/stats`
  - `GET /api/health/upstream`
- **Admin account path (optional)**:
  - Runs when `PW_ADMIN_EMAIL` and `PW_ADMIN_PASSWORD` are set
  - Verifies admin auth is accepted (status must not be `401` or `403`) for:
    - `GET /api/queue/stats`
    - `GET /api/health/upstream`

> Note: This project currently enforces admin capabilities at backend endpoint level. There is no dedicated admin-only frontend page in the current UI.

---

## How to run

From repository root (recommended stable mode):

```bash
pnpm --dir ats-frontend exec playwright test tests/e2e/visual-vision.spec.ts --project=chromium --reporter=line
pnpm --dir ats-frontend exec playwright test tests/e2e/user-workflow.spec.ts --project=chromium --reporter=line
pnpm --dir ats-frontend exec playwright test tests/integration/admin-workflow.spec.ts --project=chromium --reporter=line
```

Run all three together:

```bash
pnpm --dir ats-frontend exec playwright test tests/e2e/visual-vision.spec.ts tests/e2e/user-workflow.spec.ts tests/integration/admin-workflow.spec.ts --project=chromium --reporter=line
```

Optional full matrix run (all Playwright projects):

```bash
pnpm --dir ats-frontend exec playwright test tests/e2e/visual-vision.spec.ts tests/e2e/user-workflow.spec.ts tests/integration/admin-workflow.spec.ts --reporter=line
```

---

## Optional admin credentials for live admin workflow

If you want the admin-positive scenario to execute, set:

```bash
export PW_ADMIN_EMAIL="your-admin-email@example.com"
export PW_ADMIN_PASSWORD="your-admin-password"
```

Optional regular-user credentials override (defaults: `test@example.com` / `password123`):

```bash
export PW_USER_EMAIL="test@example.com"
export PW_USER_PASSWORD="password123"
```

Optional API base URL override (defaults to `http://localhost:3001`):

```bash
export PW_API_BASE_URL="http://localhost:3001"
```

---

## Expected outcomes

- Visual suite should produce attached screenshots for each tested screen.
- User workflow suite should complete major UI flow deterministically with mocked backend responses.
- Admin integration suite should:
  - Prove non-admin restriction behavior (`403`, with `429` accepted when auth limiter is saturated).
  - Optionally validate admin execution path when credentials are supplied.

---

## Troubleshooting quick notes

- If integration tests cannot authenticate, ensure backend is reachable and JWT env vars are configured.
- If visual tests fail intermittently on slow machines, re-run once and inspect attached screenshot artifacts.
- If admin positive test is skipped, provide `PW_ADMIN_EMAIL` and `PW_ADMIN_PASSWORD`.
- If login calls return `429`, wait for limiter window reset or restart backend before rerunning integration suite.
