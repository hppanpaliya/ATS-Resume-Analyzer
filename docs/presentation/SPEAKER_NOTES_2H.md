# ATS Resume Analyzer — Speaker Notes (120 min)

This script is aligned with `SLIDE_DECK_2H.md` and designed for a master’s-level audience.

---

## Pre-session checklist (10 minutes before start)

- Confirm API and frontend are reachable.
- Keep your backup demo account credentials ready.
- Open these side-by-side:
  - Deck: `SLIDE_DECK_2H.md`
  - Code references: `CODE_SNIPPETS.md`
  - Demo script: `DEMO_RUNBOOK.md`
- Keep one browser tab on admin console and one on dashboard.

---

## Delivery rhythm

- Aim for **concept clarity first**, then implementation details.
- Every 10–15 minutes, pause for one question.
- Use this structure repeatedly:
  1. Why this matters
  2. What we built
  3. How it works
  4. Trade-offs and next steps

---

## Segment A (Slides 1–7, ~18 min) — Opening and framing

### Core message
This project is about **candidate empowerment** in ATS-heavy hiring pipelines.

### Suggested narration
- Slide 1: Introduce project and thesis in one sentence.
- Slide 2: Explain ATS as a real bottleneck, not a hypothetical one.
- Slide 3: State the gap: candidates need specific, fast, actionable guidance.
- Slide 4: Clarify measurable objectives (fit scoring, actionable recommendations, secure workflows).
- Slide 5: Define success in terms of repeatable user outcomes.
- Slide 6: Mention realistic constraints (cost, time, free model routes, maintainability).
- Slide 7: Anchor features to personas (candidate, admin, evaluator).

### Transition line
> “Now that we know the problem and audience, I’ll show how the architecture supports this workflow end to end.”

---

## Segment B (Slides 8–14, ~20 min) — Architecture and design

### Core message
The architecture is a **modular monolith with asynchronous processing**, chosen for speed and reliability.

### Suggested narration
- Slide 8: Walk through workflow as an event chain.
- Slide 9: Explain each container quickly (SPA, API, DB, queue, AI).
- Slide 10: Emphasize separation of concerns in backend layers.
- Slide 11: Highlight entities that matter for observability and governance (`RefreshSession`, `AuditLog`).
- Slide 12: Keep API explanation functional, not exhaustive.
- Slide 13: Explain why queueing is critical for AI-bound operations.
- Slide 14: Be explicit: chose modular monolith to reduce coordination overhead early.

### Transition line
> “With architecture in place, I’ll move into how we kept it secure and resilient under real-world conditions.”

---

## Segment C (Slides 15–22, ~23 min) — Security and resilience

### Core message
Security is implemented as **layered controls**, not a single feature.

### Suggested narration
- Slide 15: Present security posture in layers.
- Slide 16: Access vs refresh token role separation.
- Slide 17: Explain refresh-session revocation and why it matters after compromise.
- Slide 18: Show role boundaries across backend and frontend.
- Slide 19: Validation + sanitization as prevention of malformed and malicious input.
- Slide 20: Explain tiered rate limits in business language (abuse control + plan differentiation).
- Slide 21: Structured error handling for predictable client behavior.
- Slide 22: Reliability controls (timeouts, retries, graceful shutdown) as operational hygiene.

### Transition line
> “Now I’ll switch to frontend architecture and show how these backend guarantees are reflected in user experience.”

---

## Segment D (Slides 23–29, ~20 min) — Frontend and UX architecture

### Core message
The frontend is designed for **safe session continuity** and **clear workflow guidance**.

### Suggested narration
- Slide 23: Route-driven architecture and dashboard shell.
- Slide 24: Protected routes for auth and admin role.
- Slide 25: Explain hydration guard; avoid stale auth state bugs.
- Slide 26: Explain interceptor-driven refresh and de-duplicated refresh requests.
- Slide 27: Async analysis UX: queue now, poll later, keep UI responsive.
- Slide 28: Resume/history support iterative improvement loops.
- Slide 29: Admin interface supports account operations with visible audit context.

### Transition line
> “After architecture, let’s validate confidence through the test strategy and what is covered.”

---

## Segment E (Slides 30–32, ~12 min) — Testing and quality

### Core message
Quality is addressed through **layered tests**: backend behavior, API contracts, and end-to-end flows.

### Suggested narration
- Slide 30: Describe unit/integration/e2e balance.
- Slide 31: Mention auth, middleware, and service-level tests as risk reducers.
- Slide 32: Explain Playwright coverage breadth and why mobile coverage matters.

### Transition line
> “Now I’ll walk through the product experience with captured evidence from desktop and mobile flows.”

---

## Segment F (Slides 33–39, ~15 min) — Product walkthrough

### Core message
The UI supports the full journey from login to actionable analysis and admin operations.

### Suggested narration by slide
- Slide 33: Set audience expectations for walkthrough sequence.
- Slide 34: Login/signup UX is straightforward and low-friction.
- Slide 35: Dashboard + settings + model controls demonstrate configurability.
- Slide 36: Resume management includes detail/edit/preview/create pathways.
- Slide 37: History and JD forms support repeat workflows.
- Slide 38: Results page explains “what,” “why,” and “how to improve.”
- Slide 39: Admin console demonstrates governance and role-specific operations.

### Transition line
> “I’ll close with engineering review insights, risks, and practical next steps.”

---

## Segment G (Slides 40–45, ~12 min) — Review, roadmap, closure

### Core message
This is a **strongly structured foundation** with clear scaling and product-evolution paths.

### Suggested narration
- Slide 40: Keep feedback balanced (strengths + realistic limitations).
- Slide 41: Prioritize risk mitigation in order of impact.
- Slide 42: Present roadmap in phased, feasible increments.
- Slide 43: Deployment story and operational readiness.
- Slide 44: Reiterate validation evidence (feature completeness + visual proof + tests).
- Slide 45: End with contribution statement and open Q&A.

---

## Time checkpoints

- 00:18 — finish Slide 7
- 00:38 — finish Slide 14
- 01:01 — finish Slide 22
- 01:21 — finish Slide 29
- 01:33 — finish Slide 32
- 01:48 — finish Slide 39
- 02:00 — finish Slide 45 + Q&A handoff

If behind schedule, shorten deep dive on slides 31, 37, 43.

---

## Demo fallback lines (if interrupted)

- If backend appears unavailable:
  > “I’ll continue with captured production-equivalent flow screenshots while the service restarts.”

- If AI request is slow/rate-limited:
  > “The async queue protects UX; I’ll show completed result flow and resume polling mechanics.”

- If admin route fails due role mismatch:
  > “Role-gated behavior is expected here; I’ll switch to pre-authorized admin session evidence.”

---

## Q&A handling strategy

Use a 3-part answer:
1. Acknowledge the concern.
2. Explain current design decision.
3. Propose next-step improvement.

Example:
> “Great question on scaling. Right now the architecture is optimized for delivery speed with queue abstraction. The next production step is fully distributed queue/cache/storage with Redis + object storage.”

---

## Final closing script (30 seconds)

> “This project demonstrates a practical, secure, and extensible ATS analysis platform. It combines a clear user workflow, robust backend controls, asynchronous AI processing, and test-driven confidence. The current implementation is deployment-ready for controlled usage and has a clear roadmap for production-scale evolution.”
