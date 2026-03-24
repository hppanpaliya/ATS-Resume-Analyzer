# ATS Resume Analyzer — 2-Hour Master’s Presentation Deck

**Project:** ATS Resume Analyzer  
**Repository:** `hppanpaliya/ATS-Resume-Analyzer`  
**PR Context:** #4 — Enhance API security, frontend resilience, and testing infrastructure

---

## Delivery map (120 minutes)

| Segment | Time | Slide Range |
|---|---:|---|
| Opening + problem framing | 18 min | 1–7 |
| Architecture + core design | 20 min | 8–14 |
| Security + resilience | 23 min | 15–22 |
| Frontend + UX architecture | 20 min | 23–29 |
| Testing + quality | 12 min | 30–32 |
| Product walkthrough (screenshots) | 15 min | 33–39 |
| Code review + roadmap + close | 12 min | 40–45 |

---

## Slide 1 — Title
- ATS Resume Analyzer: AI-powered candidate-side ATS optimization platform.
- Presenter, university, date.
- Short thesis statement: "Bridge the gap between candidate resumes and ATS expectations with actionable feedback."

## Slide 2 — Why this problem matters
- ATS systems are first gatekeepers in hiring pipelines.
- Many qualified candidates fail due to keyword/format mismatch.
- Existing tools are often recruiter-centric, not candidate-centric.

## Slide 3 — Problem statement
- Inputs are unstructured and vary in quality.
- Candidates need precise, quick, and affordable feedback.
- Solution must balance usability, reliability, and explainability.

## Slide 4 — Objectives
- Analyze resume-job fit with explainable scoring.
- Provide actionable improvement advice.
- Support iterative workflows (upload → analyze → revise → export).
- Maintain secure auth and role-based admin controls.

## Slide 5 — Success criteria
- End-to-end analysis workflow completes reliably.
- Score + keyword + formatting + experience breakdown available.
- History and export pathways are usable.
- Testable architecture with meaningful automation coverage.

## Slide 6 — Scope and constraints
- Tech stack: React + Node/Express + Prisma.
- AI provider via OpenRouter free route (`openrouter/free`).
- Local/dev-first operation with Docker deployment options.
- Emphasis: correctness, resilience, maintainability.

## Slide 7 — User personas
- Job seeker (free/pro/enterprise tiers).
- Admin (user operations, session revocation, audit visibility).
- Evaluator/mentor (assess improvement trajectory over history).

---

## Slide 8 — End-to-end workflow
1. User authenticates.
2. Resume + JD submitted.
3. Job queued for async processing.
4. AI analysis generated and persisted.
5. Frontend polls status and renders results.
6. User iterates and exports.

## Slide 9 — Container-level architecture
- **Frontend SPA:** React + Router + Zustand.
- **Backend API:** Express + middleware + services.
- **Data layer:** Prisma ORM + SQLite/PostgreSQL.
- **Async layer:** Bull queue (Redis or in-process mode).
- **AI layer:** OpenRouter-compatible API.

## Slide 10 — Backend layering model
- Routes: HTTP contracts and validation.
- Middleware: auth, rate limits, request context, error handling.
- Services: auth, AI analysis, admin operations.
- Utilities: sanitization, logging, typed errors.

## Slide 11 — Data model highlights
- Core entities: `User`, `Resume`, `JobDescription`, `Analysis`, `RefreshSession`, `AuditLog`.
- Supports historical analyses and admin traceability.
- Optimized for pagination/filtering in admin/history paths.

## Slide 12 — API surface (high-level)
- Auth: register/login/refresh/me.
- Analysis: queue + status + history + detail.
- Resumes: CRUD + preview/export.
- Models: list/refresh.
- Admin: user list/detail/update/password/session revocation.

## Slide 13 — Async analysis architecture
- Queue decouples request latency from AI latency.
- Job states tracked (`waiting`, `active`, `completed`, `failed`).
- Progress updates support responsive frontend UX.

## Slide 14 — Design trade-offs
- Monolith chosen for delivery speed and coherence.
- Queue abstraction preserves migration path to distributed processing.
- Strong modular boundaries reduce refactor friction.

---

## Slide 15 — Security posture overview
- JWT-based access + refresh flow.
- Refresh session persistence + revocation mechanics.
- Role-based authorization for admin routes.
- CORS allow-list and defensive headers.

## Slide 16 — Auth flow and session hygiene
- Access token for API auth.
- Refresh token used for silent renewal.
- Hydration logic preserves valid sessions and clears stale state.

## Slide 17 — Refresh token rotation/revocation
- Refresh sessions tracked in DB with expiry and revocation metadata.
- Reuse detection and mass session revocation path exists.
- Logout revokes active refresh sessions.

## Slide 18 — Authorization boundaries
- `authMiddleware` verifies token and user existence.
- `adminMiddleware` enforces admin-only paths.
- `ProtectedRoute` enforces auth/admin checks on frontend routes.

## Slide 19 — Input validation and sanitization
- Express validators + explicit length/type checks.
- JD/resume constraints prevent degenerate payloads.
- Sanitization utilities reduce malformed input risk.

## Slide 20 — Abuse protection
- Configurable global + route-specific limits.
- Per-user tier-aware limiters (`free`, `pro`, `enterprise`, `admin`).
- 429 responses include retry hints.

## Slide 21 — Error handling model
- Structured `AppError`/operational error handling.
- Centralized middleware response shape.
- Request context and logging improve observability.

## Slide 22 — Reliability controls
- Queue retries + backoff.
- AI timeout and provider error normalization.
- Graceful server shutdown and queue close hooks.

---

## Slide 23 — Frontend architecture at a glance
- Route-driven composition in `App.jsx`.
- Dashboard as multi-pane workspace (`analysis`, `resumes`, `history`).
- Shared API client with interceptors.

## Slide 24 — Routing and access control
- Public: `/login`, `/signup`.
- Protected: `/dashboard/*`, `/analysis/:id`.
- Admin protected: `/admin` with role gate.

## Slide 25 — Auth state persistence
- Zustand persisted store keeps minimal auth state.
- Hydration guard avoids flicker and stale auth behavior.
- `ProtectedRoute` blocks pre-hydration access leakage.

## Slide 26 — API client resilience
- Axios request token injection.
- Unified response error normalization.
- Refresh de-duplication via shared `refreshPromise`.

## Slide 27 — Analysis UX flow
- File + JD inputs validated.
- Async job enqueue then polling until completion.
- Seamless navigation to canonical analysis result route.

## Slide 28 — Resume and history UX
- Resume CRUD + preview + exports.
- History listing with detail revisit.
- Designed for iterative candidate improvement loops.

## Slide 29 — Admin UX architecture
- Searchable paginated user directory.
- Detail panel with account/session/usage/audit sections.
- High-impact controls: profile update, password reset, revoke sessions.

---

## Slide 30 — Testing strategy
- Backend unit tests (auth, middleware, services, sanitizer pathways).
- Frontend/flow tests via Playwright.
- Integration checks for API contract behavior.

## Slide 31 — Backend testing focus
- Auth correctness and error mapping.
- Admin middleware/service behavior.
- Environment fallback and sanitizer verification.

## Slide 32 — Playwright coverage map
- Auth, dashboard, resume management, analysis, admin workflows.
- Visual capture coverage for presentation assets.
- Mobile + desktop project support.

---

## Slide 33 — Product walkthrough plan
- Login/signup → analysis dashboard → resumes/history → results → admin.
- Followed by short architecture-to-code trace.
- Backed by deterministic screenshot sequence.

## Slide 34 — Login and signup experience

![Desktop Login](./screenshots/desktop/01-login.png)

![Desktop Signup](./screenshots/desktop/02-signup.png)

## Slide 35 — Analysis dashboard and settings

![Dashboard Analysis](./screenshots/desktop/03-dashboard-analysis.png)

![Settings Panel](./screenshots/desktop/04-dashboard-settings-panel.png)

![Model Selector](./screenshots/desktop/05-dashboard-analysis-model-selector.png)

## Slide 36 — Resume management flows

![Resume List](./screenshots/desktop/06-resume-list.png)

![Resume Detail](./screenshots/desktop/07-resume-detail.png)

![Resume Edit](./screenshots/desktop/08-resume-form-edit.png)

![Resume Preview Modal](./screenshots/desktop/09-resume-preview-modal.png)

![Resume Create](./screenshots/desktop/10-resume-form-create.png)

## Slide 37 — History and job description UX

![History Dashboard](./screenshots/desktop/11-history-dashboard.png)

![Job Description Form](./screenshots/desktop/12-job-description-form.png)

## Slide 38 — Analysis results page

![Analysis Results](./screenshots/desktop/13-analysis-results.png)

- Explain score, keyword match/miss, formatting, experience relevance, and advice blocks.

## Slide 39 — Admin console and mobile evidence

![Admin Entry](./screenshots/desktop/14-dashboard-admin-entry.png)

![Admin Console](./screenshots/desktop/15-admin-console.png)

![Admin Search Filtered](./screenshots/desktop/16-admin-search-filtered.png)

![Mobile Analysis](./screenshots/mobile/02-dashboard-analysis-mobile.png)

![Mobile Admin](./screenshots/mobile/05-admin-console-mobile.png)

---

## Slide 40 — Non-overtechnical code review summary
- ✅ Strong modular separation and practical middleware layering.
- ✅ Good user-facing resilience (retry, error feedback, guarded routing).
- ✅ Admin operations are meaningful and auditable.
- ⚠️ Next quality step: strengthen distributed concerns for scale.

## Slide 41 — Risks and mitigation priorities
- In-memory behaviors in single-node mode are practical but bounded.
- Move cache/session/queue fully distributed for higher concurrency.
- Add deeper telemetry (metrics dashboards, alerting).

## Slide 42 — Roadmap
- Short term: tighten security hardening + CI gates.
- Medium term: scale-ready data/storage/queue configuration.
- Long term: richer analytics, template intelligence, and subscription growth features.

## Slide 43 — Deployment and operations
- Local dev: Vite + Express.
- Docker: documented single/multi-container flows.
- Health endpoint and startup scripts support operational checks.

## Slide 44 — Evaluation summary
- Functional coverage: auth, analysis, resume lifecycle, history, admin.
- Engineering quality: structured errors, rate limiting, async processing, test scaffolding.
- Demonstration evidence: 21 screenshots across desktop/mobile flows.

## Slide 45 — Closing + Q&A
- Re-state contribution: candidate-focused ATS optimization with production-minded architecture.
- Invite discussion on architecture decisions and future research directions.

---

## Backup slide prompts (optional)
- Explain token rotation threat model in plain language.
- Compare polling vs WebSocket trade-offs for job status updates.
- Discuss why a modular monolith was selected before microservices.
