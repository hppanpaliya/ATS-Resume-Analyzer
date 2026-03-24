# System Design Document (SDD)
## ATS Resume Analyzer

_Version: 1.0_  
_Date: 2026-03-20_

## 1) Problem statement

Job seekers (especially students/new grads) struggle to understand how ATS systems score resumes. Manual feedback is slow and inconsistent.

This system provides:
- Resume-to-job-description analysis using AI
- Actionable improvement feedback
- Resume storage/versioning/export workflows

---

## 2) Objectives

### Primary
1. Provide fast ATS-style analysis with meaningful recommendations.
2. Support resume lifecycle: create, upload, manage, analyze, export.
3. Secure user sessions and data access.

### Secondary
1. Keep architecture modular for collaboration among 3 developers.
2. Keep stack practical for academic delivery + future scale.

---

## 3) Stakeholders and personas

- **End user (student/job seeker):** uploads resume, gets score, iterates.
- **Project team (3 developers):** co-builds frontend, backend, platform.
- **Evaluator (professor):** expects architecture clarity, security awareness, testing rigor.

---

## 4) Functional requirements

### FR-1 Authentication and session management
- Register/login/logout.
- Access + refresh token flow.
- Protected route access by auth status.

### FR-2 Resume management
- Create resume via text, structured data, or file upload.
- List, view, update, soft delete resumes.
- Maintain resume versions/history.

### FR-3 Job description management
- CRUD for job descriptions with validation/sanitization.

### FR-4 AI analysis
- Analyze uploaded/stored resume against selected job description.
- Persist analysis results and retrieve historical analyses.
- Support async job flow and status polling.

### FR-5 Template and export support
- Fetch templates.
- Export resume as PDF or DOCX.

### FR-6 Observability and health
- Health endpoints for local and upstream checks.

---

## 5) Non-functional requirements

### NFR-1 Security
- JWT validation on protected endpoints.
- Input sanitization and file signature validation.
- Ownership checks for user-scoped resources.

### NFR-2 Performance
- Async analysis flow to avoid blocking requests.
- Pagination for list-heavy endpoints.

### NFR-3 Reliability
- Graceful shutdown handling.
- Retry behavior for queued analysis jobs.

### NFR-4 Maintainability
- Clear module boundaries (`routes`, `services`, `middleware`, `utils`).
- Reusable frontend service/store patterns.

### NFR-5 Testability
- Unit tests (backend) + integration/E2E (frontend + API checks).

---

## 6) Key workflows

### Workflow A: New resume analysis
1. User logs in.
2. Uploads resume + enters job description.
3. Backend validates + queues analysis.
4. Frontend polls analysis job status.
5. Result persisted and shown with actionable guidance.

### Workflow B: Analyze stored resume
1. User selects saved resume.
2. Chooses/enters job description.
3. Analysis request submitted.
4. Result attached to analysis history.

### Workflow C: Resume export
1. User opens resume detail.
2. Requests PDF/DOCX export.
3. Backend generates artifact and returns file.

---

## 7) Data design summary

### Core entities
- `User`
- `Resume`
- `ResumeVersion`
- `JobDescription`
- `Analysis`
- `Template`
- `RefreshSession`
- `Subscription`
- `AuditLog`

### Relationship highlights
- One user to many resumes, analyses, job descriptions.
- One resume to many versions and analyses.
- Analysis references resume and optional job description.

---

## 8) API design notes

- REST-style endpoint grouping by domain (`/api/auth`, `/api/resumes`, `/api/analyses`, etc.).
- Standard success envelope with data payloads in most routes.
- Pagination helper usage for list endpoints.
- Job-based analysis endpoints support async state polling.

---

## 9) Security design notes

### Implemented patterns
- Access token auth middleware.
- Refresh session rotation/revocation behavior.
- File content-type signature checks for uploads.
- Sanitizer utilities on user-facing inputs.

### Priority hardening items
1. Remove hardcoded secrets from docker artifacts.
2. Remove destructive DB reset startup commands.
3. Enforce model allowlist from approved/cached models.

---

## 10) Scalability strategy

### Current baseline
- Single-instance capable with in-memory limiters.
- Async queue architecture in place.

### Scale-up path
1. Move rate limiting/stateful coordination to Redis.
2. Use PostgreSQL for multi-user production workloads.
3. Externalize file storage when moving beyond single node.

---

## 11) Testing strategy

- **Backend:** Jest unit tests for auth/AI/middleware/sanitization.
- **Frontend:** Playwright suites for auth, workflows, accessibility, and integration paths.
- **Recommended next:** Add more backend integration tests around end-to-end analysis and permission boundaries.

---

## 12) Team integration plan (3 developers)

### Developer 1 — Backend/Core
- Auth/session hardening
- Analysis workflow and service-level correctness
- Data-access optimization

### Developer 2 — Frontend/UX
- Dashboard + analysis flows
- Error/retry states
- Accessibility and usability polish

### Developer 3 — Platform/QA
- Docker/CI pipeline reliability
- Secret/env setup and docs
- Regression and integration test automation

### Collaboration cadence
- Daily short sync (10–15 min)
- Shared PR checklist (security, tests, docs)
- Weekly architecture review against this SDD

---

## 13) Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Secret leakage in config/images | High | Move all secrets to runtime env + rotate keys |
| Data loss via startup reset command | High | Replace with migration deploy flow |
| In-memory limiter in multi-instance deployment | Medium | Redis-backed distributed limiter |
| DB lock/scale constraints with SQLite | Medium/High | PostgreSQL migration profile |

---

## 14) Acceptance criteria

The design is considered complete when:
1. Core workflows (auth, resume CRUD, analyze, export) are demonstrable end-to-end.
2. Security baseline is satisfied (no hardcoded secrets, safe startup policy).
3. At least one backend + one frontend integration scenario is test-automated.
4. Architecture and implementation remain aligned with this SDD and companion architecture doc.
