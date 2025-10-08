# Technical Architecture Document
## ATS Resume Platform - Student/Entry-Level Focus

**Version:** 1.0  
**Last Updated:** October 2025  
**Project Timeline:** 1-2 months  
**Target Users:** Students & Entry-level job seekers

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Patterns](#architecture-patterns)
3. [Technology Stack](#technology-stack)
4. [System Components](#system-components)
5. [Data Flow](#data-flow)
6. [Security Architecture](#security-architecture)
7. [Scalability Considerations](#scalability-considerations)
8. [AI Integration Strategy](#ai-integration-strategy)

---

## 1. System Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                         │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐ │
│  │  React SPA     │  │ Local Storage  │  │  IndexedDB    │ │
│  │  (UI/UX)       │  │  (Cache)       │  │  (Offline)    │ │
│  └────────────────┘  └────────────────┘  └───────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                       API GATEWAY LAYER                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Express.js API Gateway (Rate Limiting, Auth)          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Auth       │  │   Resume     │  │   AI Service     │  │
│  │   Service    │  │   Service    │  │   (Multi-model)  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Template   │  │   Analysis   │  │   Export         │  │
│  │   Service    │  │   Service    │  │   Service        │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                        DATA LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  PostgreSQL  │  │    Redis     │  │   S3/CloudFlare  │  │
│  │  (Primary)   │  │   (Cache)    │  │   (File Storage) │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  OpenAI API  │  │  Gemini API  │  │  OpenRouter API  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  SendGrid    │  │  Stripe      │                        │
│  │  (Email)     │  │  (Future)    │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Design Principles

1. **Microservices-Light Architecture**: Modular services that can be independently deployed
2. **API-First Design**: RESTful APIs with clear contracts
3. **Progressive Enhancement**: Works offline with cached data
4. **Freemium-Ready**: Built-in usage tracking and limits
5. **AI-Agnostic**: Support multiple AI providers seamlessly

---

## 2. Architecture Patterns

### 2.1 Backend Architecture Pattern: Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      ROUTES LAYER                            │
│  - Express route handlers                                    │
│  - Request validation (express-validator)                    │
│  - Authentication middleware                                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    CONTROLLER LAYER                          │
│  - Business logic orchestration                              │
│  - Input/output formatting                                   │
│  - Error handling                                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     SERVICE LAYER                            │
│  - Core business logic                                       │
│  - AI service abstraction                                    │
│  - Resume processing logic                                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
│  - Database models (Sequelize/Prisma)                        │
│  - Repository pattern                                        │
│  - Data validation                                           │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Frontend Architecture Pattern: Feature-Based

```
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── store/
│   ├── resume-builder/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── store/
│   ├── resume-analyzer/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── store/
│   └── dashboard/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── store/
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── constants/
└── core/
    ├── api/
    ├── auth/
    └── storage/
```

---

## 3. Technology Stack

### 3.1 Recommended: Node.js Stack (Better for your timeline)

**Why Node.js:**
- Single language (JavaScript) across stack
- Faster development (1-2 month timeline)
- Better React integration
- Rich ecosystem for document processing
- Easier deployment

#### Backend Stack

| Component | Technology | Justification |
|-----------|-----------|---------------|
| **Runtime** | Node.js 20 LTS | Stable, modern features, long-term support |
| **Framework** | Express.js 4.x | Lightweight, flexible, huge ecosystem |
| **Database ORM** | Prisma 5.x | Type-safe, excellent DX, migrations |
| **Database** | PostgreSQL 16 | Robust, JSONB support, full-featured |
| **Cache** | Redis 7.x | Fast, supports sessions, rate limiting |
| **Authentication** | Passport.js + JWT | Flexible, supports multiple strategies |
| **File Upload** | Multer + Sharp | File handling + image optimization |
| **PDF Processing** | pdf-parse, pdf-lib | Extract & generate PDFs |
| **DOCX Processing** | mammoth, docx | Parse & create Word documents |
| **Validation** | Zod | TypeScript-first, runtime validation |
| **Task Queue** | Bull + Redis | Background jobs for AI processing |
| **Email** | Nodemailer + SendGrid | Reliable email delivery |

#### Frontend Stack

| Component | Technology | Justification |
|-----------|-----------|---------------|
| **Framework** | React 18.x | Your current choice, component-based |
| **Build Tool** | Vite 5.x | Fast, modern, better than CRA |
| **State Management** | Zustand | Simple, less boilerplate than Redux |
| **Styling** | Tailwind CSS 3.x | Already in use, rapid development |
| **Forms** | React Hook Form | Performance, validation |
| **Rich Text Editor** | TipTap | Extensible, headless, modern |
| **PDF Generation** | jsPDF + html2canvas | Client-side PDF export |
| **API Client** | Axios + React Query | Already in use, caching, retry logic |
| **Routing** | React Router 6.x | Standard, feature-rich |
| **Local Storage** | IndexedDB (Dexie.js) | Structured client-side storage |

### 3.2 Alternative: Python Stack (If preferred)

#### Backend Stack (Python)

| Component | Technology | Justification |
|-----------|-----------|---------------|
| **Framework** | FastAPI | Modern, async, auto-docs |
| **ORM** | SQLAlchemy 2.0 | Mature, flexible |
| **Database** | PostgreSQL 16 | Same as Node option |
| **Cache** | Redis 7.x | Same as Node option |
| **Authentication** | FastAPI Users | Built for FastAPI |
| **PDF Processing** | PyPDF2, ReportLab | Python ecosystem |
| **Task Queue** | Celery + Redis | Proven for async tasks |

**Note:** Recommend Node.js for your 1-2 month timeline

---

## 4. System Components

### 4.1 Authentication Service

**Responsibilities:**
- User registration/login
- JWT token generation & validation
- Password hashing (bcrypt)
- Email verification
- Password reset
- Session management

**Key Features:**
- JWT with refresh tokens
- Role-based access control (RBAC)
- Rate limiting (5 login attempts per 15 min)
- OAuth ready (Google, LinkedIn future)

### 4.2 Resume Service

**Responsibilities:**
- CRUD operations for resumes
- Version control (track changes)
- Template management
- Resume parsing from PDF/DOCX
- Resume export (PDF, DOCX, JSON)

**Key Features:**
- Multi-template support (5 initial templates)
- Section management (reorder, add, remove)
- Auto-save (every 30 seconds)
- Conflict resolution (last-write-wins)

### 4.3 AI Service (Multi-Provider)

**Responsibilities:**
- Abstract AI provider interface
- Provider selection logic
- Prompt management
- Response caching
- Cost tracking per user
- Fallback mechanism

**Supported Providers:**
1. **OpenAI GPT-4** (Primary for paid users)
2. **Google Gemini** (Free tier, good quality)
3. **OpenRouter** (Multiple models, cost-effective)

**AI Capabilities:**
1. **Content Generation**
   - Generate bullet points from job title + description
   - Create professional summaries
   - Suggest skills based on experience

2. **Content Optimization**
   - Improve existing bullets (stronger verbs, quantification)
   - Enhance clarity and impact
   - ATS-optimize language

3. **Smart Matching**
   - Keyword extraction & matching
   - Experience relevance scoring
   - Reorder sections for job match
   - Highlight gaps & suggestions

### 4.4 Analysis Service

**Responsibilities:**
- Resume scoring algorithm
- Keyword analysis
- ATS compatibility check
- Experience relevance matching
- Generate actionable feedback

**Scoring Components:**
- **Keyword Match (40%)**: JD keywords found in resume
- **Experience Relevance (30%)**: Semantic similarity
- **ATS Formatting (30%)**: Structure, fonts, compatibility

### 4.5 Template Service

**Responsibilities:**
- Store and serve resume templates
- Template preview generation
- Custom template creation (future)

**Initial Templates:**
1. **Classic**: Traditional, professional
2. **Modern**: Clean, contemporary
3. **ATS-Optimized**: Maximum compatibility
4. **Tech**: For software/IT roles
5. **Creative**: For design/creative roles

### 4.6 Export Service

**Responsibilities:**
- Generate PDF from resume data
- Generate DOCX from resume data
- Handle formatting preservation
- Watermarking (for free tier)

---

## 5. Data Flow

### 5.1 Resume Analysis Flow

```
User uploads resume + JD
         ↓
API Gateway (validate, auth)
         ↓
Resume Service (parse PDF/DOCX → text)
         ↓
Store in database (original + parsed)
         ↓
Analysis Service (extract requirements)
         ↓
AI Service (analyze with selected provider)
         ↓
Store analysis results
         ↓
Return scored results to client
         ↓
Client caches in IndexedDB
```

### 5.2 Resume Builder Flow

```
User creates new resume
         ↓
Select template
         ↓
Fill sections (auto-save every 30s)
         ↓
AI Assist: Generate/optimize content
         ↓
Real-time preview updates
         ↓
Export to PDF/DOCX
```

### 5.3 AI-Powered Optimization Flow

```
User clicks "Optimize for Job"
         ↓
Paste job description
         ↓
Analysis Service scores current resume
         ↓
AI Service generates suggestions
         ↓
Present side-by-side comparison
         ↓
User accepts/rejects changes
         ↓
Apply changes (version saved)
         ↓
Re-score optimized resume
```

---

## 6. Security Architecture

### 6.1 Authentication & Authorization

**Authentication:**
- JWT tokens (15min access, 7-day refresh)
- Secure HTTP-only cookies for refresh tokens
- CSRF protection

**Authorization:**
- Role-based (Free, Premium, Admin)
- Resource-based (user can only access their resumes)
- Rate limiting by tier

### 6.2 Data Security

**At Rest:**
- Database encryption (PostgreSQL built-in)
- Password hashing (bcrypt, 10 rounds)
- Sensitive data encrypted (AES-256)

**In Transit:**
- HTTPS/TLS 1.3
- Secure WebSocket (WSS) for real-time features

**Input Validation:**
- Sanitize all user inputs
- File upload validation (type, size, content)
- SQL injection prevention (ORM parameterized queries)
- XSS prevention (React automatic escaping + DOMPurify)

### 6.3 API Security

**Rate Limiting (per tier):**
- Free: 10 req/min, 100 req/day
- Premium: 60 req/min, 1000 req/day

**CORS:**
- Whitelist specific origins
- Credentials included

**API Keys:**
- AI provider keys in environment variables
- Rotation strategy

---

## 7. Scalability Considerations

### 7.1 Database Scaling

**Phase 1 (MVP):** Single PostgreSQL instance
**Phase 2:** Read replicas for analytics
**Phase 3:** Sharding by user_id

**Optimization:**
- Indexed columns (user_id, created_at, updated_at)
- JSONB for flexible resume data
- Partitioning for large tables (by month)

### 7.2 Caching Strategy

**Redis Layers:**
1. **Session Cache**: User sessions (15min TTL)
2. **API Response Cache**: Analysis results (1hr TTL)
3. **AI Response Cache**: Identical prompts (24hr TTL)
4. **Rate Limit Counter**: Request tracking

**Client Cache (IndexedDB):**
- Store resumes offline
- Cache analysis results
- Template previews

### 7.3 File Storage Strategy

**Phase 1:** Local filesystem (development)
**Phase 2:** AWS S3 / Cloudflare R2
- Original uploaded files
- Generated PDFs
- User profile pictures

**CDN:** Cloudflare for static assets & templates

### 7.4 Background Processing

**Job Queue (Bull):**
- AI content generation (async)
- Bulk exports
- Email notifications
- Analytics aggregation

---

## 8. AI Integration Strategy

### 8.1 Multi-Provider Architecture

```javascript
// AI Provider Interface
interface AIProvider {
  name: string;
  analyze(resume: string, jd: string): Promise<AnalysisResult>;
  generateBullets(context: string): Promise<string[]>;
  optimizeContent(content: string, jd: string): Promise<string>;
  costPerRequest: number;
}

// Provider Selection Logic
class AIService {
  providers: AIProvider[];
  
  selectProvider(userTier: string, task: string): AIProvider {
    if (userTier === 'free') return this.providers.find(p => p.name === 'gemini');
    if (task === 'analysis') return this.providers.find(p => p.name === 'openai');
    return this.providers.find(p => p.costPerRequest === Math.min(...));
  }
}
```

### 8.2 Provider Configuration

| Provider | Use Case | Cost | Free Tier | Quality |
|----------|----------|------|-----------|---------|
| **Google Gemini** | Free users, initial analysis | Free | 60 req/min | Good |
| **OpenAI GPT-4** | Premium users, complex tasks | $$ | Pay-per-use | Excellent |
| **OpenRouter** | Cost optimization, variety | $ | Varies | Good-Excellent |

### 8.3 Prompt Engineering Strategy

**Centralized Prompts:**
```javascript
const PROMPTS = {
  RESUME_ANALYSIS: `You are an expert ATS analyzer...`,
  BULLET_GENERATION: `Generate professional bullet points...`,
  CONTENT_OPTIMIZATION: `Optimize the following content...`
};
```

**Version Control:** Track prompt versions for A/B testing

### 8.4 Cost Control

**Free Tier Limits:**
- 5 AI analyses per day
- 20 AI-generated bullets per day
- Basic optimization only

**Premium Tier:**
- Unlimited analyses
- Unlimited generations
- Advanced optimization
- Priority processing

**Cost Tracking:**
```javascript
// Track AI usage per user
{
  userId: string,
  provider: string,
  tokensUsed: number,
  costEstimate: number,
  timestamp: Date
}
```

---

## 9. Deployment Architecture

### 9.1 Development Environment

```
Local:
- Node.js server (localhost:3001)
- React dev server (localhost:3000)
- PostgreSQL (Docker)
- Redis (Docker)
```

### 9.2 Production Environment (Recommended)

**Option A: Vercel + Railway (Easiest, Free Start)**
- Frontend: Vercel (free tier, excellent DX)
- Backend: Railway (generous free tier)
- Database: Railway PostgreSQL
- Redis: Railway Redis

**Option B: AWS (More Control)**
- Frontend: S3 + CloudFront
- Backend: EC2 / ECS
- Database: RDS PostgreSQL
- Redis: ElastiCache

**Option C: Render (Simplest All-in-One)**
- Frontend & Backend: Render
- Database: Render PostgreSQL
- Redis: Render Redis

### 9.3 CI/CD Pipeline

```
GitHub Push
    ↓
GitHub Actions
    ↓
Run Tests
    ↓
Build Frontend (Vite)
    ↓
Build Backend (TypeScript)
    ↓
Deploy to Vercel (Frontend)
    ↓
Deploy to Railway (Backend)
    ↓
Run DB Migrations
    ↓
Health Check
```

---

## 10. Monitoring & Observability

### 10.1 Logging

- **Application Logs**: Winston (structured JSON)
- **Error Tracking**: Sentry
- **Access Logs**: Morgan (Express middleware)

### 10.2 Metrics

- **Application Metrics**: Prometheus
- **Dashboard**: Grafana (future)
- **Uptime Monitoring**: UptimeRobot (free)

### 10.3 Key Metrics to Track

1. **Business Metrics:**
   - Daily/monthly active users
   - Resume creations per user
   - Analysis runs per day
   - Conversion rate (free → premium)

2. **Technical Metrics:**
   - API response times (p50, p95, p99)
   - Error rates
   - AI provider response times
   - Database query performance

3. **Cost Metrics:**
   - AI API costs per user
   - Infrastructure costs
   - Cost per active user

---

## 11. Future Enhancements (Post-MVP)

### Phase 2 (Months 3-4)
- LinkedIn profile sync
- Job board integration
- Cover letter generation
- Interview preparation tips

### Phase 3 (Months 5-6)
- Chrome extension (one-click apply)
- Mobile app (React Native)
- Team accounts (university career centers)
- Analytics dashboard

### Phase 4 (Months 7+)
- ATS simulator (test against real ATS systems)
- Video resume support
- Portfolio integration
- Job matching algorithm

---

## 12. Success Metrics

### MVP Success Criteria (Month 2)
- [ ] 100 registered users
- [ ] 500 resumes created
- [ ] 1000 analysis runs
- [ ] < 2s average analysis time
- [ ] 95% uptime
- [ ] < $50/month infrastructure cost

### Growth Targets (Month 6)
- [ ] 1,000 registered users
- [ ] 5,000 resumes created
- [ ] 10,000 analysis runs
- [ ] 5% conversion to premium
- [ ] < 1s average page load
- [ ] 99% uptime

---

## Appendix: Technology Decision Matrix

| Criteria | Node.js + Express | Python + FastAPI |
|----------|-------------------|------------------|
| **Development Speed** | ⭐⭐⭐⭐⭐ (Single language) | ⭐⭐⭐⭐ (Quick API setup) |
| **Performance** | ⭐⭐⭐⭐ (Non-blocking I/O) | ⭐⭐⭐⭐⭐ (Native async) |
| **Ecosystem** | ⭐⭐⭐⭐⭐ (npm, huge) | ⭐⭐⭐⭐ (PyPI, ML-focused) |
| **Learning Curve** | ⭐⭐⭐⭐⭐ (You know it) | ⭐⭐⭐ (New syntax) |
| **AI Libraries** | ⭐⭐⭐⭐ (OpenAI SDK) | ⭐⭐⭐⭐⭐ (LangChain, native) |
| **Document Processing** | ⭐⭐⭐⭐ (Good libraries) | ⭐⭐⭐⭐⭐ (Excellent) |
| **Timeline Fit** | ⭐⭐⭐⭐⭐ (1-2 months) | ⭐⭐⭐⭐ (Slightly slower) |
| **Deployment** | ⭐⭐⭐⭐⭐ (Many options) | ⭐⭐⭐⭐ (Slightly harder) |

**Recommendation:** Node.js + Express for your 1-2 month timeline

---

**Document Version:** 1.0  
**Last Updated:** October 8, 2025  
**Next Review:** Implementation kickoff
