# Live Demo Runbook (10–15 minutes)

This runbook is optimized for presentation flow continuity.

---

## 1) Pre-demo setup

### Services
- Start backend (`ats-backend`) and ensure health endpoint responds.
- Start frontend (`ats-frontend`) and confirm app loads.

### Accounts
- One regular user account (candidate flow).
- One admin account (admin console flow).

### Demo data prepared
- One realistic resume text.
- One realistic job description.

### Browser tabs
1. User dashboard
2. Admin route (`/admin`)
3. Notes tab with resume/JD copy

---

## 2) Demo sequence

### Segment A — Auth and orientation (2 min)
1. Show login/signup screen quickly.
2. Sign in as user.
3. Introduce dashboard tabs (analysis, resumes, history).

### Segment B — Core analysis flow (5–6 min)
1. Upload/select resume or paste text.
2. Paste job description.
3. (Optional) open settings/model selector.
4. Click **Analyze Resume**.
5. Explain queue + polling while waiting.
6. On results page, explain:
   - overall score
   - keyword match/missing
   - formatting score
   - experience relevance
   - actionable advice

### Segment C — Resume lifecycle + history (2–3 min)
1. Open resumes tab.
2. Show resume detail/edit/preview quickly.
3. Open history and show saved analysis continuity.

### Segment D — Admin walkthrough (2–3 min)
1. Switch to admin user/session.
2. Open admin console.
3. Search a user.
4. Show update profile, set password, revoke sessions.
5. Highlight audit visibility.

---

## 3) Fallback plans

### If backend is temporarily unavailable
- Continue with screenshot-backed walkthrough from `docs/presentation/screenshots`.
- Explain that architecture supports graceful retries and async behavior.

### If AI call is delayed or rate-limited
- Show historical completed analysis.
- Explain queue decoupling and polling design.

### If admin access fails
- Demonstrate role gating as expected behavior.
- Switch to known admin session and continue.

---

## 4) Key lines to say

- “We treat AI latency as a system design concern, so user requests stay responsive.”
- “This is candidate-centric ATS optimization, not recruiter-side filtering software.”
- “Admin controls are explicit and auditable, including password reset and session revocation.”
- “The architecture is modular enough to scale without premature microservice complexity.”

---

## 5) End demo close (30–45 sec)

- Re-state value: faster, clearer ATS improvement loop for candidates.
- Re-state engineering confidence: security + async resilience + test coverage.
- Transition to Q&A or code deep dive.
