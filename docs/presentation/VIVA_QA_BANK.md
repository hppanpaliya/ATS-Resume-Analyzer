# Viva Q&A Bank (Master’s Level)

Prepared for architecture, security, reliability, testing, AI integration, and product-defense discussions.

---

## Architecture

1. **Why modular monolith over microservices?**  
   Faster iteration, lower operational overhead, and clear migration path using queue/storage abstractions.

2. **How is the system layered?**  
   Routes → Middleware → Services → Data/Queue/AI providers.

3. **Why async queue for analysis?**  
   AI calls are variable-latency; queue keeps API responsive and retry-capable.

4. **How do frontend and backend separation of concerns align?**  
   Frontend uses pages/components/services/stores; backend uses routes/middleware/services.

5. **Where is coupling risk highest?**  
   API response contracts between analysis/admin routes and frontend rendering logic.

---

## Security

6. **How is auth implemented?**  
   JWT access tokens + refresh sessions stored with revocation metadata.

7. **How is refresh-token abuse handled?**  
   Session validation and revocation pathways reduce reuse risk.

8. **How is admin access controlled?**  
   Backend `adminMiddleware` + frontend `requireAdmin` route gate.

9. **How is abuse/rate limiting addressed?**  
   Global and route-specific limits + tier-based user limits.

10. **What are top security improvements next?**  
    Stronger anomaly detection, stricter high-risk endpoint throttling, deeper telemetry.

---

## Reliability and Scalability

11. **How does job lifecycle work?**  
    Queue → process → progress updates → persisted result.

12. **How are failures reported?**  
    Structured error responses with stable shape and request context.

13. **What happens on AI provider latency spikes?**  
    Submission remains non-blocking; frontend polls; retries and timeout handling apply.

14. **What scales first in production?**  
    Queue/cache/session/storage should become fully distributed.

15. **What are current scale bottlenecks?**  
    Single-instance assumptions in some runtime paths and limited operational metrics.

---

## Testing and Quality

16. **What does the test strategy cover?**  
    Backend unit tests + Playwright E2E/integration coverage for key workflows.

17. **Why include mobile tests/screenshots?**  
    Responsive behavior is part of UX correctness, not cosmetic-only.

18. **What should be improved in CI?**  
    Enforce stricter coverage gates and run critical path E2E on each merge.

19. **How do you reduce regression risk in auth flows?**  
    Keep middleware/service tests plus interceptor/session-hydration tests.

20. **How would you test queue reliability further?**  
    Add retry/backoff edge tests and failure-injection scenarios.

---

## AI Integration

21. **How is model selection managed?**  
    User-selectable model path with defaults and parameter controls.

22. **How do you balance quality vs cost?**  
    Default affordable route now; tiered model policy as product matures.

23. **How is AI output validated?**  
    Parse + structural checks before rendering/persisting critical fields.

24. **Main AI reliability risks?**  
    Provider rate limits, latency variance, and response-format drift.

25. **What’s the next AI reliability step?**  
    Strong schema validation + fallback behavior when provider quality drops.

---

## Product and roadmap

26. **What is the unique value proposition?**  
    Candidate-centric ATS optimization with clear, actionable improvements.

27. **Why include admin operations in this release?**  
    Operational governance and support readiness are required for real usage.

28. **What roadmap item has highest impact?**  
    Distributed-ready reliability improvements (queue/cache/storage/session hardening).

29. **How does this become research-worthy?**  
    Benchmark scoring consistency, recommendation quality, and user outcome improvements.

30. **What is the strongest defense statement?**  
    The system delivers practical user value now while preserving a clear path to production-grade scale and governance.
