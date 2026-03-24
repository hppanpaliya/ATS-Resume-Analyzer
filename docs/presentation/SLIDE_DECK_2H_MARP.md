---
marp: true
theme: default
class: invert
paginate: true
backgroundColor: #1a1a2e
color: #eaeaea
headingDivider: 1
footer: 'ATS Resume Analyzer — Master''s Presentation | hppanpaliya/ATS-Resume-Analyzer'
---

# ATS Resume Analyzer
## AI-powered candidate-side ATS optimization platform

**Repository:** `hppanpaliya/ATS-Resume-Analyzer`  
**PR:** #4 — Enhance API security, frontend resilience, and testing infrastructure

---

<!-- _paginate: false -->
<!-- _class: lead -->

## Delivery Timeline

| Segment | Time | Slides |
|---|:---:|---|
| **Opening** | 18 min | 1–7 |
| **Architecture** | 20 min | 8–14 |
| **Security** | 23 min | 15–22 |
| **Frontend** | 20 min | 23–29 |
| **Testing** | 12 min | 30–32 |
| **Walkthrough** | 15 min | 33–39 |
| **Review + Close** | 12 min | 40–45 |

*Total: 120 minutes | Pace: ~2.5 min per slide average*

---

<!-- _paginate: false -->
<!-- notes: (0–2 min) Welcome and introduce the ATS problem space. Briefly mention your academic/professional background. Thesis: This project bridges the gap between candidates and ATS systems with explainable AI feedback. Establish energy and invite questions at the end. -->

## Why This Problem Matters

- **ATS systems are gatekeepers:** 75% of resumes never see a human reviewer.
- **Format/keyword mismatch is invisible:** Qualified candidates fail due to parsing errors.
- **Tools are recruiter-centric:** Existing solutions help hirers, not candidates.
- **Opportunity:** Candidate-focused, transparent, affordable analysis.

---

<!-- _paginate: false -->
<!-- notes: (2–4 min) Walk through a concrete scenario: a candidate with strong background but resume doesn't include job description keywords. Show how an ATS system might reject it. Explain the data quality variation (PDFs, DOCX, plain text) and the need for speed/affordability. -->

## Problem Statement

1. **Input variability:** Resumes come in multiple formats; quality varies widely.
2. **Analysis demand:** Candidates need fast, affordable, precise feedback.
3. **Explainability gap:** Black-box scoring is unhelpful; actionable advice is critical.

**Challenge:** Balance speed, cost, and reliability while maintaining intuitive UX.

---

<!-- _paginate: false -->
<!-- notes: (4–6 min) Present the learning objectives for your defense committee. Show how you've addressed each in the project's design. Tie to problem statement. -->

## Project Objectives

✅ Analyze resume-job fit with explainable scoring  
✅ Provide actionable improvement advice  
✅ Support iterative workflows (upload → analyze → revise → export)  
✅ Maintain secure authentication and role-based controls  
✅ Demonstrate production-minded architecture and testing practices

---

<!-- _paginate: false -->
<!-- notes: (6–8 min) Translate objectives into concrete success metrics. These are testable outcomes you've measured. -->

## Success Criteria

- ✓ Analysis completes reliably end-to-end
- ✓ Score breakdown (overall, keywords, format, experience) is accurate
- ✓ History and export pathways are usable
- ✓ Auth and admin controls are secure
- ✓ Test coverage captures critical paths
- ✓ Team can understand and extend the codebase

---

<!-- _paginate: false -->
<!-- notes: (8–10 min) Manage expectations. Explain the tech choices and constraints. Mention OpenRouter free route to control costs. Local-first for dev/testing, Docker for deployment. -->

## Scope and Constraints

**Technology Stack:**
- React 18 + Vite (frontend SPA)
- Express 5 + TypeScript (backend API)
- Prisma ORM (SQLite dev / PostgreSQL prod)
- Bull Queue (async job processing)
- OpenRouter API (free model routing)

**Key constraint:** Cost control via free AI routes; determinism via local dev environment.

---

<!-- _paginate: false -->
<!-- notes: (10–12 min) User personas help justify design decisions (e.g., why filtering/search in admin, why export options). Mention subscription tiers briefly. -->

## User Personas and Access Control

1. **Job Seeker** (free/pro/enterprise)
   - Upload resumes, submit job descriptions, receive analysis
   - Export results as PDF/DOCX

2. **Admin** (internal)
   - View user base, reset passwords, revoke sessions
   - Audit log and usage tracking

3. **Mentor/Evaluator** (pro/enterprise)
   - Assess peer improvement trajectory over history

---

# Architecture & Core Design

---

<!-- _paginate: false -->
<!-- notes: (12–15 min) Zoom out and paint the big picture. Layers: frontend SPA communicates async with backend API. Backend queues AI jobs. Async processor extracts text, calls AI, persists results. Database and cache/session storage are critical. -->

## End-to-End Workflow

```
1. User logs in                    (auth flow)
2. Upload resume + job description (frontend input)
3. Submit for analysis             (backend enqueues job)
4. Job processes                   (queue: extract text → call AI → persist)
5. Frontend polls for status       (async UX)
6. Results rendered               (score + keywords + advice)
7. User exports or iterates       (repeat cycle)
```

---

<!-- _paginate: false -->
<!-- notes: (15–17 min) Describe each layer's responsibility. Emphasize clean separation. -->

## Container-Level Architecture

```
┌─────────────────────────────────────┐
│  Frontend (React SPA)               │
│  - Router + Zustand state           │
│  - Glassmorphism UI + dark mode     │
└─────────────────────────────────────┘
         ↓ HTTPS ↑
┌─────────────────────────────────────┐
│  Backend API (Express)              │
│  - Routes → Middleware → Services   │
│  - Auth, analysis, admin endpoints  │
└─────────────────────────────────────┘
         ↓ Queue ↓
┌─────────────────────────────────────┐
│  Async Processing (Bull Queue)      │
│  - Job processor: text + AI + store │
│  - Retry logic, progress tracking   │
└─────────────────────────────────────┘
         ↓ Prisma ↓
┌─────────────────────────────────────┐
│  Data Layer (SQLite / PostgreSQL)   │
│  - Users, resumes, analyses, logs   │
└─────────────────────────────────────┘
```

---

<!-- _paginate: false -->
<!-- notes: (17–19 min) Explain backend layering. Routes define contracts. Middleware enforces security and context. Services contain business logic. Utilities are reusable. -->

## Backend Layering Model

**Routes** → HTTP contracts + validation  
📍 `auth.routes`, `analysis.routes`, `admin.routes`

**Middleware** → Auth, rate limits, request context, error handling  
📍 `authMiddleware`, `rate-limiter`, `error.middleware`

**Services** → Business logic (auth, AI, admin, file processing)  
📍 `auth.service`, `ai.service`, `admin.service`

**Utilities** → Sanitization, typed errors, JSON parsing  
📍 `sanitizer.ts`, `json.ts`, `error.ts`

---

<!-- _paginate: false -->
<!-- notes: (19–21 min) Quick entity overview. Highlight the relationships and why they matter for audit/history. -->

## Data Model Highlights

**Core Entities:**
- `User`: Authentication, profile, subscription tier
- `Resume`: Uploaded content, file references, extracted text
- `JobDescription`: Title, description, company metadata
- `Analysis`: Result JSON, AI provider/model, processing time
- `RefreshSession`: Token revocation tracking
- `AuditLog`: User actions, entity changes, timestamps

**Key Design:** Immutable analysis history + audit trail enable debugging and compliance.

---

<!-- _paginate: false -->
<!-- notes: (21–23 min) API surface at 10,000 feet. Mention that full docs are in CLAUDE.md but highlight the flow. -->

## API Surface (High-Level)

| Endpoint Family | Purpose |
|---|---|
| `/api/auth/*` | Register, login, refresh, profile |
| `/api/analyze` | Queue analysis, poll status |
| `/api/resumes/*` | CRUD, preview, export |
| `/api/models` | List + refresh available AI models |
| `/api/admin/*` | User ops, session mgmt, audit log |

---

<!-- _paginate: false -->
<!-- notes: (23–25 min) Explain why async. Latency isolation: user gets quick 202, then polls. Job retries + backoff handle transient failures. Progress tracking makes UX responsive. -->

## Async Analysis Architecture

**Why async?**
- Decouples request latency from AI processing latency
- Supports retry + backoff for transient failures
- Enables progress tracking and cancellation

**Job states:** `waiting` → `active` → `completed` / `failed`

**Example flow:**
```
POST /analyze (202 Accepted)
  ↓ Job enqueued
GET /analyze/:id/status → { progress: 50%, eta: 10s }
  ↓ Polling every 2s
GET /analyze/:id/status → { progress: 100%, result: {...} }
```

---

<!-- _paginate: false -->
<!-- notes: (25–27 min) Justify monolith choice. Emphasize preserving migration paths. Explain queue abstraction. -->

## Design Trade-Offs

**Monolith vs. Microservices:**
- Chosen: Monolith for delivery speed and team coherence
- Trade-off: Easier refactor, single deployment, single database
- Preservation: Queue abstraction allows distributed migration later

**Async Queue Abstraction:**
- In-memory Bull (dev), Redis-backed (prod)
- Allows upgrade to job broker (RabbitMQ, Kafka) without route changes

---

# Security & Resilience

---

<!-- _paginate: false -->
<!-- notes: (27–30 min) Security is multi-layered. Start with auth flow fundamentals. Explain the threat model. -->

## Security Posture Overview

**Layers:**
1. **Auth:** JWT access + refresh tokens, secure storage
2. **Session:** Refresh session DB tracking + revocation
3. **Authorization:** Role-based middleware checks
4. **Input:** Validators + sanitization
5. **Abuse:** Global + per-user rate limiting
6. **Headers:** CORS allow-list, CSP, security headers

---

<!-- _paginate: false -->
<!-- notes: (30–33 min) Deep dive into token flow. Explain hydration logic and edge cases. Why refresh tokens? Why not just long-lived tokens? -->

## JWT Flow and Session Hygiene

**Access Token (15 min expiry):**
- Issued after login; includes user ID
- Verified by `authMiddleware` on every request
- Short TTL reduces exposure if compromised

**Refresh Token (7 day expiry):**
- Stored in `RefreshSession` table with hash
- Used to silently renew access token
- Axios interceptor handles renewal transparently

**Hydration Logic:**
```
On app load:
1. Check localStorage for valid refresh token
2. If valid, refresh access token (silent renewal)
3. Populate Zustand auth store
4. Prevent pre-auth render flicker
```

---

<!-- _paginate: false -->
<!-- notes: (33–35 min) Explain refresh token rotation. Why reuse detection? Threat scenario: session hijacking. -->

## Refresh Token Rotation & Revocation

**Threat Model:** Attacker steals refresh token from compromised device.

**Defense:**
- Refresh sessions stored in DB with metadata (issued, expires, revoked)
- Token reuse detected: if refresh already claimed, revoke all sessions for that user
- Mass revocation: admin can revoke all sessions for a user account

**Flow:**
```
Normal:   GET /refresh → new tokens → DB update
Attack:  GET /refresh with stolen token → DUPLICATE DETECTED → 
         Revoke all sessions + require re-login
```

---

<!-- _paginate: false -->
<!-- notes: (35–37 min) Authorization boundaries. Explain middleware ordering. Admin checks come before service logic. -->

## Authorization Boundaries

**Backend:**
- `authMiddleware`: Verify JWT + user exists (all protected routes)
- `adminMiddleware`: Verify user role === 'admin' (admin routes only)
- Error responses include no sensitive info (e.g., "Unauthorized")

**Frontend:**
- `ProtectedRoute`: Redirect to login if not authenticated
- Admin routes check user role before rendering

---

<!-- _paginate: false -->
<!-- notes: (37–39 min) Input validation. Show concrete examples from code. Explain length constraints and type checks. -->

## Input Validation and Sanitization

**Express Validators:**
```typescript
// Resume upload
- Max 10 MB file size
- Allowed types: PDF, DOCX only
- Filename sanitized (no path traversal)

// Job description
- Max 5000 characters
- Min 100 characters
- Sanitize HTML tags
```

**Custom Sanitizers:**
- Remove SQL-like sequences
- Escape user-generated strings in logs
- Validate JSON responses from AI

---

<!-- _paginate: false -->
<!-- notes: (39–41 min) Rate limiting strategy. Explain why per-user tiers. Show 429 response with retry hint. -->

## Abuse Protection: Rate Limiting

**Global limit:** 1000 req/hour per IP  
**Per-user limits (tier-aware):**
- Free: 10 analyses/day
- Pro: 100 analyses/day
- Enterprise: unlimited
- Admin: always allowed

**Response (429):**
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 3600,
  "limit": 10,
  "used": 10,
  "tier": "free"
}
```

---

<!-- _paginate: false -->
<!-- notes: (41–43 min) Error handling strategy. Structured errors. Centralized middleware. Context for debugging. -->

## Error Handling Model

**Structured Errors (`AppError`):**
```typescript
class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public context?: Record<string, any>
  ) {}
}
```

**Centralized Middleware:**
- Catches all errors
- Logs with request context (user ID, route, timestamp)
- Responds with consistent JSON shape
- No stack traces in production

---

<!-- _paginate: false -->
<!-- notes: (43–45 min) Reliability controls. Async retry logic. AI timeout. Graceful shutdown. These make the system robust in production. -->

## Reliability Controls

**Queue Retries:** Failed AI calls retry with exponential backoff (max 3x)

**AI Timeouts:** 60 sec limit + fallback response (score = 0, note: "AI timeout")

**Graceful Shutdown:**
```typescript
// On SIGTERM:
1. Stop accepting new requests
2. Drain active jobs from queue
3. Close database connections
4. Exit
```

---

# Frontend Architecture & UX

---

<!-- _paginate: false -->
<!-- notes: (45–48 min) Frontend is React SPA. Zustand for state. Axios for API. Let's break down routing and state. -->

## Frontend Architecture at a Glance

**React Components:**
- `App.jsx`: Route definitions (public, protected, admin)
- `Dashboard.jsx`: Multi-tab workspace (analysis, resumes, history)
- `AnalysisDashboard.jsx`: Resume + JD input, polling UX
- `AdminPage.jsx`: User directory, session management

**State:**
- `authStore.js` (Zustand): User, tokens, refresh logic
- Component local state: Forms, UI toggles

**API:**
- `api.js` (Axios): Request injection, 401 handler, error normalization

---

<!-- _paginate: false -->
<!-- notes: (48–50 min) Routing strategy. Explain why public/protected/admin split. ProtectedRoute guard logic. -->

## Routing and Access Control

```
PUBLIC:
  /login       → LoginPage
  /signup      → SignUpPage

PROTECTED:
  /dashboard   → Dashboard (multi-tab)
  /analysis/:id → AnalysisPage
  /history     → HistoryPage

ADMIN:
  /admin       → AdminPage (role gate)
```

**ProtectedRoute:**
- Checks auth state hydration
- Redirects unauthenticated users to /login
- Verifies admin role for admin routes

---

<!-- _paginate: false -->
<!-- notes: (50–52 min) Auth state persistence. Zustand + localStorage. Hydration guard. Why does this matter? Prevents flicker and stale auth bugs. -->

## Auth State Persistence

**Zustand Persisted Store:**
```javascript
const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      hydrated: false,
      // ... actions
    }),
    { name: "auth-store" }  // persists to localStorage
  )
);
```

**Hydration Guard:**
```jsx
useEffect(() => {
  // Restore state from localStorage on mount
  // Set hydrated flag to prevent pre-auth render
}, []);

if (!hydrated) return <LoadingScreen />;
```

---

<!-- _paginate: false -->
<!-- notes: (52–54 min) API client resilience. Axios interceptors. Token injection. Refresh de-duplication. Show code pattern. -->

## API Client Resilience

**Request Interceptor:**
```typescript
client.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});
```

**Response Interceptor (401 handling):**
```typescript
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      // Refresh token and retry request
      const newToken = await refreshToken();
      return client(error.config);
    }
  }
);
```

**De-duplication:** Only one refresh call even if multiple requests get 401 simultaneously.

---

<!-- _paginate: false -->
<!-- notes: (54–56 min) Analysis UX flow. Demo the experience. Poll every 2s until completion. Redirect to results page. -->

## Analysis UX Flow

1. **Input Phase:**
   - User selects resume file or pastes text
   - User pastes job description
   - Optional: select AI model + parameters

2. **Queue Phase:**
   - POST to `/api/analyze` → 202 Accepted
   - Poll `/api/analyze/:id/status` every 2 seconds
   - Show progress bar

3. **Results Phase:**
   - Redirect to `/analysis/:id`
   - Render score breakdown + keywords + advice

---

<!-- _paginate: false -->
<!-- notes: (56–58 min) Resume and history UX. Iterative workflow. Show how candidates improve their resume and track progress. -->

## Resume and History UX

**Resume Management:**
- Create new resume (manual entry or upload)
- Edit existing resume
- Preview in modal
- Export to PDF or DOCX
- Delete (soft delete)

**History Dashboard:**
- List all past analyses
- Click to revisit results
- Track improvement trajectory

**Iterative Workflow:**
```
Upload resume v1
  ↓ Analyze → Score 65%
  ↓ Get advice
  ↓ Edit resume v2
  ↓ Analyze → Score 78%
  ↓ Export final version
```

---

<!-- _paginate: false -->
<!-- notes: (58–60 min) Admin UX. Searchable user directory. Session management. High-impact controls. Show screenshots if time permits. -->

## Admin UX Architecture

**User Directory:**
- Searchable by email / name (pagination)
- Sort by subscription tier, created date, usage

**User Detail Panel:**
- Profile: name, email, tier, created date, usage stats
- Sessions: list active refresh sessions, revoke
- Audit Log: recent user actions

**High-Impact Controls:**
- Update user profile (name, email)
- Reset password (generate temp password)
- Revoke all sessions (force re-login)

---

# Testing & Quality Assurance

---

<!-- _paginate: false -->
<!-- notes: (60–63 min) Testing pyramid. Unit tests for logic. Integration tests for API contracts. E2E tests for critical flows. Explain coverage strategy. -->

## Testing Strategy

**Unit Tests** (backend services, middleware)
- Auth correctness (token generation, validation)
- Rate limiter behavior
- Error handling
- Sanitization logic

**Integration Tests** (API contracts)
- POST /register → token response
- POST /analyze → job enqueue
- GET /user → auth required

**Playwright E2E Tests** (critical user flows)
- Login → analysis → export
- Admin user search → session revoke
- Mobile responsiveness

---

<!-- _paginate: false -->
<!-- notes: (63–65 min) Backend testing focus. Show test structure. Example: auth middleware test. -->

## Backend Testing Focus

**Auth Middleware Tests:**
```typescript
describe('authMiddleware', () => {
  it('should deny requests without token', () => {
    // expect 401
  });
  it('should deny expired tokens', () => {
    // expect 401
  });
  it('should allow valid tokens', () => {
    // expect request to proceed
  });
});
```

**Service Tests:**
- `auth.service`: register, login, refresh workflows
- `ai.service`: model fallback, prompt execution
- `admin.service`: user search, password reset

---

<!-- _paginate: false -->
<!-- notes: (65–67 min) Playwright coverage. Visual screenshots. Mobile + desktop. Deterministic test order. -->

## Playwright Coverage Map

**E2E Scenarios:**
- Authentication (login, signup, password validation, token refresh)
- Analysis workflow (upload, submit, poll, view results)
- Resume management (CRUD, export, preview)
- Admin operations (user search, session revoke, audit log)
- Mobile responsiveness (viewport 375×667)

**Output:**
- 21 deterministic desktop + mobile screenshots
- Used for presentation assets

---

# Product Walkthrough (Screenshots)

---

<!-- _paginate: false -->
<!-- notes: (67–70 min) Walk through the product from a user perspective. Explain each screen. Reference actual screenshots. -->

## Login and Signup Experience

![w:400](./screenshots/desktop/01-login.png)

**Login Screen:**
- Email + password input
- "Don't have an account?" link
- Error feedback for invalid credentials

---

## Signup and Create Account

![w:400](./screenshots/desktop/02-signup.png)

**Signup Screen:**
- Name, email, password validation
- Password strength feedback
- Auto-redirect to analysis dashboard on success

---

## Analysis Dashboard and Settings

![w:400](./screenshots/desktop/03-dashboard-analysis.png)

**Analysis Tab:**
- Resume file upload or text paste
- Job description input
- Settings button (top-right)

---

## Settings and Model Selector

![w:400](./screenshots/desktop/04-dashboard-settings-panel.png)

**Settings Flyout:**
- Theme toggle (dark / light)
- AI model selection
- Advanced parameters (temperature, max tokens)

---

## Model Preview and Selection

![w:400](./screenshots/desktop/05-dashboard-analysis-model-selector.png)

**Model Dropdown:**
- List of available models (free + paid routes)
- Current selection highlighted
- Pricing info per model

---

## Resume Management: List View

![w:400](./screenshots/desktop/06-resume-list.png)

**Resume List:**
- Search + filter by name
- Create new button
- Edit, preview, delete, export actions

---

## Resume Detail View

![w:400](./screenshots/desktop/07-resume-detail.png)

**Resume Card:**
- Title, date created, last modified
- Quick stat: analyses run, last score
- Action buttons: edit, delete, export

---

## Resume Form: Edit Mode

![w:450](./screenshots/desktop/08-resume-form-edit.png)

**Resume Editor:**
- Name field
- Rich text or raw text input
- Save, cancel, preview buttons

---

## Resume Preview Modal

![w:450](./screenshots/desktop/09-resume-preview-modal.png)

**Preview Modal:**
- Full resume text in read-only mode
- Download as PDF + DOCX
- Close button

---

## Resume Form: Create New

![w:450](./screenshots/desktop/10-resume-form-create.png)

**Create Form:**
- Upload file (PDF / DOCX) or paste text
- Auto-extract text from PDF
- Save as new resume

---

## History Dashboard

![w:400](./screenshots/desktop/11-history-dashboard.png)

**History Tab:**
- List of past analyses with date, score, job title
- Click to view detailed results
- Export history as CSV (optional)

---

## Job Description Form

![w:450](./screenshots/desktop/12-job-description-form.png)

**JD Input:**
- Company name field
- Job title field
- Job description textarea
- Save for later option

---

## Analysis Results Page

![w:400](./screenshots/desktop/13-analysis-results.png)

**Results Breakdown:**
- Overall ATS score (0-100)
- Keyword match/miss sections
- Formatting score
- Experience relevance score
- Actionable advice block

---

## Admin Dashboard Entry Point

![w:400](./screenshots/desktop/14-dashboard-admin-entry.png)

**Dashboard (User):**
- Tab bar includes "Admin" button (if admin)
- Hotkey or menu link for admins

---

## Admin Console: User Directory

![w:400](./screenshots/desktop/15-admin-console.png)

**Admin UI:**
- User search bar
- Pagination controls
- User list with email, tier, joins date, usage

---

## Admin Search Filtered

![w:400](./screenshots/desktop/16-admin-search-filtered.png)

**Search Results:**
- Filtered user list
- Detail panel on select (profile, sessions, audit log)

---

## Mobile: Analysis Dashboard

![w:300](./screenshots/mobile/02-dashboard-analysis-mobile.png)

**Mobile Responsive:**
- Full width inputs
- Touch-friendly buttons
- Settings accessible from hamburger menu

---

## Mobile: Admin Console

![w:300](./screenshots/mobile/05-admin-console-mobile.png)

**Mobile Admin:**
- Responsive user list
- Detail panel adjusts to viewport
- Swipe or tap to manage sessions

---

# Code Review & Roadmap

---

<!-- _paginate: false -->
<!-- notes: (70–73 min) Non-overtechnical review. Highlight strengths, risks, roadmap. Explain why these decisions matter. -->

## Non-Overtechnical Code Review Summary

**Strengths:**
- ✅ Clean separation: routes → middleware → services
- ✅ User-facing resilience: retry, error feedback, guarded routing
- ✅ Audit trail and admin operations are meaningful
- ✅ Modular boundaries reduce refactor friction

**Risks:**
- ⚠️ In-memory queue/cache bounded to single node
- ⚠️ Refresh session table growth without pruning
- ⚠️ No distributed tracing or metrics dashboard

---

<!-- _paginate: false -->
<!-- notes: (73–75 min) Explain scale concerns. Distributed queue, cache, session store. Telemetry. Why these matter for production. -->

## Risks and Mitigation Priorities

**Short term (next release):**
- Strengthen CORS + CSP headers
- Add CI gates for test coverage
- Pruning job for old logs/sessions

**Medium term (3–6 months):**
- Move cache/session/queue to Redis (distributed)
- Add observability (metrics, alerting, tracing)
- Password rotation policies

**Long term (6–12 months):**
- Richer analytics (user behavior, subscription trends)
- Template intelligence (smart resume suggestions)
- API gateway for rate limit enforcement

---

<!-- _paginate: false -->
<!-- notes: (75–77 min) Deployment pipeline. Local dev vs. Docker. Health checks. Startup scripts. Ready for production handoff. -->

## Deployment and Operations

**Local Development:**
```bash
# Frontend
npm run dev  # Vite on :3000

# Backend
npm run prisma:generate
npm run dev  # Express on :3001
```

**Docker:**
```bash
docker-compose up  # Single command
# Frontend on :3000, backend on :3001, DB initialized
```

**Health Check:**
```bash
curl http://localhost:3001/health
# { "status": "ok", "uptime": 123 }
```

---

<!-- _paginate: false -->
<!-- notes: (77–79 min) Evaluation summary. Tie back to objectives. Functional coverage. Engineering quality. Evidence from screenshots. -->

## Evaluation Summary

**Functional Coverage:**
✓ Auth (register, login, refresh, password reset)  
✓ Analysis (queue, status, history, export)  
✓ Resume lifecycle (CRUD, upload, extract, export)  
✓ Admin operations (user search, session management, audit log)

**Engineering Quality:**
✓ Structured error handling + logging  
✓ Rate limiting (global + per-user tiers)  
✓ Async job processing with retries  
✓ Test scaffolding (unit, integration, E2E)  
✓ Production-ready deployment (Docker, health checks)

**Demonstration:**
✓ 21 deterministic screenshots (desktop + mobile)  
✓ Covered all critical user flows

---

# Closing & Q&A

---

<!-- _paginate: false -->
<!-- _class: lead -->

## Key Contribution

**ATS Resume Analyzer** bridges the gap between job seekers and ATS systems with:
- 🎯 **Explainable AI:** Transparent scoring + actionable advice
- 🔒 **Security first:** JWT + session hygiene + rate limiting
- ⚙️ **Production architecture:** Async processing, audit trails, graceful error handling
- 🎨 **Candidate-focused UX:** Iterative workflows, export options, history tracking

---

<!-- _paginate: false -->
<!-- _class: lead -->

## Thank You

**Questions?**

Feel free to ask about:
- Architecture decisions and trade-offs
- Security implementation details
- Testing and quality assurance
- Deployment and operations
- Future research directions

---

# Backup Slides (Optional)

---

<!-- _paginate: false -->

## Backup: Token Rotation Threat Model

**Scenario:** User's device is compromised; attacker obtains refresh token from localStorage.

**Attack:** Attacker uses stolen token to issue new access token and hijack account.

**Defense:**
1. **Refresh session table tracks each token's hash + issued timestamp**
2. **On legitimate user login from new device → revoke old sessions**
3. **On token reuse detection → revoke ALL sessions for that user**
4. **User must re-login (forces password verification)**

**Lesson:** Distributed rotation (database + client-side checks) is stronger than client-only tokens.

---

<!-- _paginate: false -->

## Backup: Polling vs. WebSocket Trade-Offs

**Polling** (current implementation):
- Pros: Simpler backend, works with stateless scaling, no connection state
- Cons: Higher latency (2 sec check interval), CPU overhead at scale

**WebSocket:**
- Pros: Real-time push, lower latency, user feels instant feedback
- Cons: Stateful connections, harder to scale, requires connection manager

**Future:** Could implement WebSocket server as optional upgrade for pro+ users.

---

<!-- _paginate: false -->

## Backup: Monolith vs. Microservices 

**Why Monolith Here?**
1. **Delivery speed:** One codebase, one deployment
2. **Coherence:** Easier to maintain consistent error handling, logging, auth
3. **Team size:** Single small team that understands the full system

**Preserve Migration Path:**
- Queue abstraction allows moving to job broker
- Service separation (auth, analysis, admin) allows extraction to separate processes

**When to move to microservices:**
- Team grows (>10 engineers)
- Load justifies independent scaling (e.g., analysis service)
- Organizational boundaries exist (e.g., separate teams on each service)

---

<!-- _paginate: false -->

## Backup: Why Free AI Models?

**OpenRouter `openrouter/free` strategy:**

1. **Cost Control:** $0 operational cost for development and small deployments
2. **Model Rotation:** OpenRouter automatically routes to available free models (Meta Llama, etc.)
3. **Fallback Chain:** If free model fails, retry with paid backup
4. **User Value:** Candidates get free analysis + low-cost pro tier ($5/mo)

**Trade-off:** Speed/quality varies by daily free model capacity vs. guaranteed fast response with paid routes.

---

<!-- _paginate: false -->

## Backup: Database Schema Evolution

**Migration Strategy:**
1. Schema defined in `prisma/schema.prisma`
2. Migrations auto-generated: `npm run prisma:migrate`
3. Versioned migrations in Git
4. Dev: auto-reset on schema change
5. Prod: explicit migration command before deploy

**Current schema:** 6 migrations across features (auth, analysis, file storage, audit log, refresh sessions).

---

<!-- _paginate: false -->

## Backup: Sampling Resume Analysis Prompt

```javascript
const prompt = `
Analyze this resume against the job description.
Return JSON with:
{
  "overallScore": 0-100,
  "keywordsMatched": ["skill1", "skill2"],
  "keywordsMissed": ["skill3"],
  "formattingScore": 0-100,
  "experienceRelevanceScore": 0-100,
  "advice": ["Suggestion 1", "Suggestion 2"]
}
`;
```

**Key design:** Structured JSON response + explicit scoring scales ensure consistency across AI models.

---

<!-- _paginate: false -->

## Backup: Rate Limiter Implementation

```typescript
// Per-user tier awareness
const limits = {
  free: 10,      // analyses/day
  pro: 100,
  enterprise: -1, // unlimited
};

// Caching strategy
const userTier = await cache.get(`user:${userId}:tier`);
const used = redis.incr(`analysis:${userId}:${date}`);
if (used > limits[userTier]) {
  throw new RateLimitError();
}
```

**Trade-off:** In-memory cache vs. Redis. Current: Redis via Bull; could optimize with local cache for warm paths.

---

<!-- _paginate: false -->

## Backup: E2E Test Example (Playwright)

```typescript
test('user can analyze resume and view results', async ({ page }) => {
  // Login
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // Dashboard
  await page.waitForURL('**/dashboard');
  
  // Upload resume
  await page.setInputFiles('input[type="file"]', 'resume.pdf');
  await page.fill('textarea', 'Job description...');
  await page.click('button', { hasText: 'Analyze' });
  
  // Poll for results
  await page.waitForURL('**/analysis/**');
  await expect(page.locator('[data-test="score"]')).toContainText(/\d+/);
});
```

---

<!-- _paginate: false -->

## Backup: Glossary

| Term | Definition |
|---|---|
| ATS | Applicant Tracking System (used by recruiters to screen resumes) |
| JWT | JSON Web Token (stateless auth credential) |
| Bull Queue | Node.js job queue library (with Redis support) |
| Prisma ORM | TypeScript-first database query builder |
| OpenRouter | API that routes to free + paid LLM models |
| Middleware | Function that intercepts requests (auth, rate limit, error handling) |
| Async processing | Non-blocking task execution (queue-based) |
| E2E Testing | End-to-end user scenario testing (Playwright) |

---

<!-- _paginate: false -->
<!-- _class: lead -->

## End of Presentation

**Thank you for your attention.**

Repository: `hppanpaliya/ATS-Resume-Analyzer`  
GitHub PR: #4 — Enhance API security, frontend resilience, and testing infrastructure

---
