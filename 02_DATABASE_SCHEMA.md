# Database Schema Design
## ATS Resume Platform - PostgreSQL + Redis

**Version:** 1.0  
**Database:** PostgreSQL 16  
**ORM:** Prisma 5.x  
**Last Updated:** October 2025

---

## Table of Contents
1. [Database Selection Rationale](#database-selection-rationale)
2. [Schema Overview](#schema-overview)
3. [Core Tables](#core-tables)
4. [Indexing Strategy](#indexing-strategy)
5. [Relationships](#relationships)
6. [Prisma Schema](#prisma-schema)
7. [Redis Schema](#redis-schema)
8. [Migrations Strategy](#migrations-strategy)
9. [Data Retention Policy](#data-retention-policy)

---

## 1. Database Selection Rationale

### Why PostgreSQL?

| Feature | Benefit for ATS Platform |
|---------|-------------------------|
| **JSONB Support** | Store flexible resume data without rigid schema |
| **Full-Text Search** | Search resumes by keywords |
| **Robust ACID** | Ensure data consistency for user accounts |
| **Mature Ecosystem** | Battle-tested for web applications |
| **Cost-Effective** | Free, open-source, generous free tiers |
| **Array Types** | Store skill lists, keywords efficiently |
| **Partitioning** | Scale large tables (analytics) |

### Why Redis?

| Use Case | Purpose |
|----------|---------|
| **Session Storage** | Fast user session lookup |
| **Rate Limiting** | Track API request counts |
| **Cache Layer** | Cache AI responses, analysis results |
| **Job Queue** | Bull queue for background tasks |

---

## 2. Schema Overview

### Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────────┐       ┌──────────────┐
│    users    │◄─────►│    resumes      │◄─────►│  templates   │
└─────────────┘       └─────────────────┘       └──────────────┘
       │                       │
       │                       │
       ▼                       ▼
┌─────────────┐       ┌─────────────────┐
│subscriptions│       │resume_versions  │
└─────────────┘       └─────────────────┘
                              │
                              ▼
                      ┌─────────────────┐       ┌──────────────┐
                      │   analyses      │◄─────►│job_descriptions│
                      └─────────────────┘       └──────────────┘
                              │
                              ▼
                      ┌─────────────────┐
                      │ analysis_results│
                      └─────────────────┘
       
┌─────────────┐       ┌─────────────────┐
│ ai_usage    │       │  audit_logs     │
└─────────────┘       └─────────────────┘
```

### Database Statistics (Estimated for 10,000 users)

| Table | Estimated Rows | Avg Row Size | Total Size |
|-------|---------------|--------------|------------|
| users | 10,000 | 500 bytes | 5 MB |
| resumes | 30,000 | 50 KB | 1.5 GB |
| resume_versions | 150,000 | 50 KB | 7.5 GB |
| analyses | 100,000 | 10 KB | 1 GB |
| analysis_results | 100,000 | 15 KB | 1.5 GB |
| ai_usage | 500,000 | 200 bytes | 100 MB |
| job_descriptions | 50,000 | 5 KB | 250 MB |
| **Total** | - | - | **~12 GB** |

---

## 3. Core Tables

### 3.1 Users Table

**Purpose:** Store user account information, authentication, and subscription status

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Authentication
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255) NOT NULL,
  
  -- Profile
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  profile_picture_url TEXT,
  
  -- Subscription
  subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'admin')),
  subscription_start_date TIMESTAMP,
  subscription_end_date TIMESTAMP,
  
  -- Usage Tracking
  resumes_created INTEGER DEFAULT 0,
  analyses_run_today INTEGER DEFAULT 0,
  last_analysis_date DATE,
  
  -- AI Usage Limits (Reset daily)
  ai_generations_today INTEGER DEFAULT 0,
  ai_optimizations_today INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP,
  deleted_at TIMESTAMP, -- Soft delete
  
  -- Settings (JSONB for flexibility)
  settings JSONB DEFAULT '{"theme": "light", "notifications": true}'::jsonb,
  
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;
```

### 3.2 Resumes Table

**Purpose:** Store resume metadata and content

```sql
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Resume Info
  title VARCHAR(255) NOT NULL, -- e.g., "Software Engineer Resume"
  template_id UUID REFERENCES templates(id),
  
  -- Content (JSONB for flexibility)
  content JSONB NOT NULL, -- Structured resume data
  /*
  Example content structure:
  {
    "personalInfo": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "location": "San Francisco, CA",
      "linkedin": "linkedin.com/in/johndoe"
    },
    "summary": "Experienced software engineer...",
    "experience": [
      {
        "title": "Senior Developer",
        "company": "Tech Corp",
        "location": "SF, CA",
        "startDate": "2020-01",
        "endDate": "2023-06",
        "bullets": ["Developed...", "Led..."]
      }
    ],
    "education": [...],
    "skills": {
      "technical": ["Python", "React"],
      "soft": ["Leadership"]
    },
    "projects": [...],
    "certifications": [...]
  }
  */
  
  -- Extracted Text (for search & analysis)
  extracted_text TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_public BOOLEAN DEFAULT FALSE,
  
  -- AI Enhancement
  ai_optimized_for_jd_id UUID REFERENCES job_descriptions(id),
  optimization_score INTEGER, -- 0-100
  
  -- File References (if uploaded)
  original_file_url TEXT, -- S3 URL for uploaded file
  exported_pdf_url TEXT, -- Generated PDF URL
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_accessed_at TIMESTAMP,
  deleted_at TIMESTAMP,
  
  -- Version tracking
  version INTEGER DEFAULT 1,
  parent_resume_id UUID REFERENCES resumes(id), -- For optimization variants
  
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resumes_template_id ON resumes(template_id);
CREATE INDEX idx_resumes_status ON resumes(status);
CREATE INDEX idx_resumes_created_at ON resumes(created_at DESC);
CREATE INDEX idx_resumes_updated_at ON resumes(updated_at DESC);
CREATE INDEX idx_resumes_deleted_at ON resumes(deleted_at) WHERE deleted_at IS NULL;

-- Full-text search index
CREATE INDEX idx_resumes_extracted_text ON resumes USING GIN(to_tsvector('english', extracted_text));

-- JSONB index for skill search
CREATE INDEX idx_resumes_skills ON resumes USING GIN((content -> 'skills'));
```

### 3.3 Resume Versions Table

**Purpose:** Version control for resumes (track changes, allow rollback)

```sql
CREATE TABLE resume_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  
  -- Version Info
  version_number INTEGER NOT NULL,
  content JSONB NOT NULL, -- Snapshot of resume content
  
  -- Change Tracking
  change_summary TEXT, -- e.g., "Added 3 bullet points to XYZ Corp"
  changed_by_user_id UUID REFERENCES users(id),
  change_type VARCHAR(20) CHECK (change_type IN ('manual', 'ai_optimized', 'template_change')),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_resume_version UNIQUE (resume_id, version_number)
);

-- Indexes
CREATE INDEX idx_resume_versions_resume_id ON resume_versions(resume_id);
CREATE INDEX idx_resume_versions_created_at ON resume_versions(created_at DESC);
```

### 3.4 Templates Table

**Purpose:** Store resume templates (design + structure)

```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template Info
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50), -- e.g., "classic", "modern", "tech"
  
  -- Template Design (JSONB for flexibility)
  design JSONB NOT NULL,
  /*
  {
    "layout": "single-column",
    "fonts": {
      "heading": "Playfair Display",
      "body": "Lato"
    },
    "colors": {
      "primary": "#2c3e50",
      "secondary": "#3498db"
    },
    "sectionOrder": ["personalInfo", "summary", "experience", "education", "skills"],
    "spacing": {
      "margins": "1in",
      "lineHeight": 1.5
    }
  }
  */
  
  -- Preview & Demo
  preview_image_url TEXT,
  demo_resume_id UUID, -- Reference to example resume
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_premium BOOLEAN DEFAULT FALSE,
  ats_score INTEGER, -- How ATS-friendly (0-100)
  
  -- Usage Stats
  usage_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_is_active ON templates(is_active);
CREATE INDEX idx_templates_usage_count ON templates(usage_count DESC);
```

### 3.5 Job Descriptions Table

**Purpose:** Store job descriptions for analysis and optimization

```sql
CREATE TABLE job_descriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Job Info
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  location VARCHAR(255),
  
  -- Job Description Content
  description TEXT NOT NULL,
  
  -- Extracted Data (JSONB)
  extracted_data JSONB,
  /*
  {
    "requiredSkills": ["Python", "AWS"],
    "preferredSkills": ["Docker", "K8s"],
    "requiredExperience": "3+ years",
    "education": "Bachelor's in CS",
    "responsibilities": ["Design...", "Develop..."],
    "keywords": ["software", "engineer", "cloud"]
  }
  */
  
  -- Source
  source_url TEXT, -- If scraped from job board
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_job_descriptions_user_id ON job_descriptions(user_id);
CREATE INDEX idx_job_descriptions_created_at ON job_descriptions(created_at DESC);

-- Full-text search
CREATE INDEX idx_job_descriptions_text ON job_descriptions USING GIN(to_tsvector('english', description));
```

### 3.6 Analyses Table

**Purpose:** Store analysis requests and results

```sql
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  job_description_id UUID REFERENCES job_descriptions(id) ON DELETE SET NULL,
  
  -- Analysis Type
  analysis_type VARCHAR(50) NOT NULL CHECK (analysis_type IN ('ats_score', 'keyword_match', 'full_analysis', 'optimization')),
  
  -- AI Provider Used
  ai_provider VARCHAR(50), -- 'openai', 'gemini', 'openrouter'
  model_used VARCHAR(100), -- 'gpt-4', 'gemini-pro'
  
  -- Results (JSONB)
  results JSONB NOT NULL,
  /*
  {
    "overallScore": 78,
    "keywordAnalysis": {
      "foundKeywords": ["Python", "AWS"],
      "missingKeywords": ["Docker", "Kubernetes"]
    },
    "experienceRelevance": {
      "summary": "...",
      "details": [...]
    },
    "atsFormattingScore": {
      "score": 85,
      "feedback": "..."
    },
    "actionableAdvice": ["...", "..."]
  }
  */
  
  -- Performance Metrics
  processing_time_ms INTEGER,
  tokens_used INTEGER,
  estimated_cost DECIMAL(10, 6),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_resume_id ON analyses(resume_id);
CREATE INDEX idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX idx_analyses_status ON analyses(status);
```

### 3.7 AI Usage Table

**Purpose:** Track AI API usage for cost control and limits

```sql
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Request Info
  feature VARCHAR(50) NOT NULL, -- 'analysis', 'generation', 'optimization'
  ai_provider VARCHAR(50) NOT NULL,
  model VARCHAR(100),
  
  -- Usage Metrics
  tokens_used INTEGER,
  estimated_cost DECIMAL(10, 6),
  
  -- Request/Response (for debugging, encrypted)
  request_summary TEXT, -- Brief summary, not full content
  response_summary TEXT,
  
  -- Performance
  response_time_ms INTEGER,
  was_cached BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date DATE DEFAULT CURRENT_DATE -- For daily aggregation
);

-- Indexes
CREATE INDEX idx_ai_usage_user_id ON ai_usage(user_id);
CREATE INDEX idx_ai_usage_date ON ai_usage(date);
CREATE INDEX idx_ai_usage_feature ON ai_usage(feature);

-- Partitioning (for large-scale)
-- Partition by month for better query performance
```

### 3.8 Audit Logs Table

**Purpose:** Security and compliance (track important actions)

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Action Info
  action VARCHAR(100) NOT NULL, -- 'user_login', 'resume_created', 'analysis_run'
  entity_type VARCHAR(50), -- 'user', 'resume', 'analysis'
  entity_id UUID,
  
  -- Request Details
  ip_address INET,
  user_agent TEXT,
  
  -- Changes (JSONB)
  changes JSONB,
  /*
  {
    "before": {...},
    "after": {...}
  }
  */
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

### 3.9 Subscriptions Table (Future Premium)

**Purpose:** Track subscription details for premium users

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Subscription Info
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('free', 'premium_monthly', 'premium_annual')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  
  -- Billing
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  
  -- Dates
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  trial_end_date TIMESTAMP,
  cancelled_at TIMESTAMP,
  
  -- Limits (override defaults)
  custom_limits JSONB,
  /*
  {
    "analysesPerDay": 50,
    "aiGenerationsPerDay": 100,
    "maxResumes": 20
  }
  */
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date);
```

---

## 4. Indexing Strategy

### 4.1 Index Types Used

| Index Type | Use Case | Tables |
|-----------|----------|--------|
| **B-Tree (default)** | Equality, range queries | Most ID, date columns |
| **GIN (Generalized Inverted)** | JSONB, full-text search | `content`, `extracted_text` |
| **Partial Index** | Optimize queries with WHERE clause | `deleted_at IS NULL` |
| **Composite Index** | Multi-column queries | `(user_id, created_at)` |

### 4.2 Critical Indexes

```sql
-- User lookup by email (login)
CREATE INDEX idx_users_email ON users(email);

-- User resumes (dashboard)
CREATE INDEX idx_resumes_user_created ON resumes(user_id, created_at DESC) WHERE deleted_at IS NULL;

-- Recent analyses for user
CREATE INDEX idx_analyses_user_recent ON analyses(user_id, created_at DESC) WHERE status = 'completed';

-- AI usage daily aggregation
CREATE INDEX idx_ai_usage_user_date ON ai_usage(user_id, date);

-- Job description search
CREATE INDEX idx_job_descriptions_search ON job_descriptions USING GIN(to_tsvector('english', description));
```

### 4.3 Index Maintenance

```sql
-- Rebuild indexes periodically (monthly)
REINDEX TABLE resumes;

-- Analyze tables for query planner
ANALYZE resumes;
ANALYZE analyses;

-- Monitor index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

---

## 5. Relationships

### 5.1 Key Relationships

```sql
-- One-to-Many
users → resumes (1:N)
users → job_descriptions (1:N)
users → analyses (1:N)
resumes → resume_versions (1:N)
resumes → analyses (1:N)

-- Many-to-One
resumes → templates (N:1)
resumes → job_descriptions (N:1, for optimization)

-- One-to-One
users → subscriptions (1:1)

-- Self-Referencing
resumes → resumes (parent_resume_id, for variants)
```

### 5.2 Cascade Rules

| Relationship | On Delete | Reasoning |
|-------------|-----------|-----------|
| users → resumes | CASCADE | Delete user's resumes when user deleted |
| users → analyses | CASCADE | Delete user's analyses when user deleted |
| resumes → resume_versions | CASCADE | Delete versions when resume deleted |
| resumes → analyses | SET NULL | Keep analysis history even if resume deleted |

---

## 6. Prisma Schema

**File:** `prisma/schema.prisma`

```prisma
// This is your Prisma schema file

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ========================================
// MODELS
// ========================================

model User {
  id                    String    @id @default(uuid()) @db.Uuid
  
  // Authentication
  email                 String    @unique @db.VarChar(255)
  emailVerified         Boolean   @default(false) @map("email_verified")
  passwordHash          String    @map("password_hash") @db.VarChar(255)
  
  // Profile
  firstName             String?   @map("first_name") @db.VarChar(100)
  lastName              String?   @map("last_name") @db.VarChar(100)
  phone                 String?   @db.VarChar(20)
  profilePictureUrl     String?   @map("profile_picture_url")
  
  // Subscription
  subscriptionTier      String    @default("free") @map("subscription_tier") @db.VarChar(20)
  subscriptionStartDate DateTime? @map("subscription_start_date")
  subscriptionEndDate   DateTime? @map("subscription_end_date")
  
  // Usage Tracking
  resumesCreated        Int       @default(0) @map("resumes_created")
  analysesRunToday      Int       @default(0) @map("analyses_run_today")
  lastAnalysisDate      DateTime? @map("last_analysis_date") @db.Date
  
  // AI Usage Limits
  aiGenerationsToday    Int       @default(0) @map("ai_generations_today")
  aiOptimizationsToday  Int       @default(0) @map("ai_optimizations_today")
  
  // Metadata
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")
  lastLoginAt           DateTime? @map("last_login_at")
  deletedAt             DateTime? @map("deleted_at")
  
  // Settings
  settings              Json      @default("{\"theme\": \"light\", \"notifications\": true}")
  
  // Relations
  resumes               Resume[]
  jobDescriptions       JobDescription[]
  analyses              Analysis[]
  aiUsage               AiUsage[]
  subscription          Subscription?
  auditLogs             AuditLog[]
  
  @@index([email])
  @@index([subscriptionTier])
  @@index([createdAt])
  @@map("users")
}

model Resume {
  id                    String    @id @default(uuid()) @db.Uuid
  userId                String    @map("user_id") @db.Uuid
  
  // Resume Info
  title                 String    @db.VarChar(255)
  templateId            String?   @map("template_id") @db.Uuid
  
  // Content
  content               Json
  extractedText         String?   @map("extracted_text")
  
  // Status
  status                String    @default("draft") @db.VarChar(20)
  isPublic              Boolean   @default(false) @map("is_public")
  
  // AI Enhancement
  aiOptimizedForJdId    String?   @map("ai_optimized_for_jd_id") @db.Uuid
  optimizationScore     Int?      @map("optimization_score")
  
  // Files
  originalFileUrl       String?   @map("original_file_url")
  exportedPdfUrl        String?   @map("exported_pdf_url")
  
  // Metadata
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")
  lastAccessedAt        DateTime? @map("last_accessed_at")
  deletedAt             DateTime? @map("deleted_at")
  
  // Version
  version               Int       @default(1)
  parentResumeId        String?   @map("parent_resume_id") @db.Uuid
  
  // Relations
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  template              Template? @relation(fields: [templateId], references: [id])
  jobDescription        JobDescription? @relation(fields: [aiOptimizedForJdId], references: [id])
  parentResume          Resume?   @relation("ResumeVariants", fields: [parentResumeId], references: [id])
  childResumes          Resume[]  @relation("ResumeVariants")
  versions              ResumeVersion[]
  analyses              Analysis[]
  
  @@index([userId])
  @@index([templateId])
  @@index([status])
  @@index([createdAt(sort: Desc)])
  @@index([updatedAt(sort: Desc)])
  @@map("resumes")
}

model ResumeVersion {
  id                    String    @id @default(uuid()) @db.Uuid
  resumeId              String    @map("resume_id") @db.Uuid
  
  // Version Info
  versionNumber         Int       @map("version_number")
  content               Json
  
  // Change Tracking
  changeSummary         String?   @map("change_summary")
  changedByUserId       String?   @map("changed_by_user_id") @db.Uuid
  changeType            String?   @map("change_type") @db.VarChar(20)
  
  // Metadata
  createdAt             DateTime  @default(now()) @map("created_at")
  
  // Relations
  resume                Resume    @relation(fields: [resumeId], references: [id], onDelete: Cascade)
  
  @@unique([resumeId, versionNumber])
  @@index([resumeId])
  @@index([createdAt(sort: Desc)])
  @@map("resume_versions")
}

model Template {
  id                    String    @id @default(uuid()) @db.Uuid
  
  // Template Info
  name                  String    @unique @db.VarChar(100)
  description           String?
  category              String?   @db.VarChar(50)
  
  // Design
  design                Json
  
  // Preview
  previewImageUrl       String?   @map("preview_image_url")
  demoResumeId          String?   @map("demo_resume_id") @db.Uuid
  
  // Status
  isActive              Boolean   @default(true) @map("is_active")
  isPremium             Boolean   @default(false) @map("is_premium")
  atsScore              Int?      @map("ats_score")
  
  // Usage
  usageCount            Int       @default(0) @map("usage_count")
  
  // Metadata
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")
  
  // Relations
  resumes               Resume[]
  
  @@index([category])
  @@index([isActive])
  @@index([usageCount(sort: Desc)])
  @@map("templates")
}

model JobDescription {
  id                    String    @id @default(uuid()) @db.Uuid
  userId                String    @map("user_id") @db.Uuid
  
  // Job Info
  title                 String    @db.VarChar(255)
  company               String?   @db.VarChar(255)
  location              String?   @db.VarChar(255)
  
  // Content
  description           String
  extractedData         Json?     @map("extracted_data")
  
  // Source
  sourceUrl             String?   @map("source_url")
  
  // Metadata
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")
  deletedAt             DateTime? @map("deleted_at")
  
  // Relations
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  analyses              Analysis[]
  optimizedResumes      Resume[]
  
  @@index([userId])
  @@index([createdAt(sort: Desc)])
  @@map("job_descriptions")
}

model Analysis {
  id                    String    @id @default(uuid()) @db.Uuid
  userId                String    @map("user_id") @db.Uuid
  resumeId              String    @map("resume_id") @db.Uuid
  jobDescriptionId      String?   @map("job_description_id") @db.Uuid
  
  // Analysis Type
  analysisType          String    @map("analysis_type") @db.VarChar(50)
  
  // AI Provider
  aiProvider            String?   @map("ai_provider") @db.VarChar(50)
  modelUsed             String?   @map("model_used") @db.VarChar(100)
  
  // Results
  results               Json
  
  // Performance
  processingTimeMs      Int?      @map("processing_time_ms")
  tokensUsed            Int?      @map("tokens_used")
  estimatedCost         Decimal?  @map("estimated_cost") @db.Decimal(10, 6)
  
  // Status
  status                String    @default("pending") @db.VarChar(20)
  errorMessage          String?   @map("error_message")
  
  // Metadata
  createdAt             DateTime  @default(now()) @map("created_at")
  completedAt           DateTime? @map("completed_at")
  
  // Relations
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  resume                Resume    @relation(fields: [resumeId], references: [id], onDelete: Cascade)
  jobDescription        JobDescription? @relation(fields: [jobDescriptionId], references: [id], onDelete: SetNull)
  
  @@index([userId])
  @@index([resumeId])
  @@index([createdAt(sort: Desc)])
  @@index([status])
  @@map("analyses")
}

model AiUsage {
  id                    String    @id @default(uuid()) @db.Uuid
  userId                String    @map("user_id") @db.Uuid
  
  // Request Info
  feature               String    @db.VarChar(50)
  aiProvider            String    @map("ai_provider") @db.VarChar(50)
  model                 String?   @db.VarChar(100)
  
  // Usage Metrics
  tokensUsed            Int?      @map("tokens_used")
  estimatedCost         Decimal?  @map("estimated_cost") @db.Decimal(10, 6)
  
  // Summaries
  requestSummary        String?   @map("request_summary")
  responseSummary       String?   @map("response_summary")
  
  // Performance
  responseTimeMs        Int?      @map("response_time_ms")
  wasCached             Boolean   @default(false) @map("was_cached")
  
  // Metadata
  createdAt             DateTime  @default(now()) @map("created_at")
  date                  DateTime  @default(now()) @db.Date
  
  // Relations
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([date])
  @@index([feature])
  @@map("ai_usage")
}

model Subscription {
  id                    String    @id @default(uuid()) @db.Uuid
  userId                String    @unique @map("user_id") @db.Uuid
  
  // Subscription Info
  tier                  String    @db.VarChar(20)
  status                String    @default("active") @db.VarChar(20)
  
  // Billing
  stripeCustomerId      String?   @map("stripe_customer_id") @db.VarChar(255)
  stripeSubscriptionId  String?   @map("stripe_subscription_id") @db.VarChar(255)
  
  // Dates
  startDate             DateTime  @map("start_date")
  endDate               DateTime? @map("end_date")
  trialEndDate          DateTime? @map("trial_end_date")
  cancelledAt           DateTime? @map("cancelled_at")
  
  // Custom Limits
  customLimits          Json?     @map("custom_limits")
  
  // Metadata
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")
  
  // Relations
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([status])
  @@index([endDate])
  @@map("subscriptions")
}

model AuditLog {
  id                    String    @id @default(uuid()) @db.Uuid
  userId                String?   @map("user_id") @db.Uuid
  
  // Action Info
  action                String    @db.VarChar(100)
  entityType            String?   @map("entity_type") @db.VarChar(50)
  entityId              String?   @map("entity_id") @db.Uuid
  
  // Request Details
  ipAddress             String?   @map("ip_address") @db.Inet
  userAgent             String?   @map("user_agent")
  
  // Changes
  changes               Json?
  
  // Metadata
  createdAt             DateTime  @default(now()) @map("created_at")
  
  // Relations
  user                  User?     @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  @@index([userId])
  @@index([action])
  @@index([createdAt(sort: Desc)])
  @@map("audit_logs")
}
```

---

## 7. Redis Schema

### 7.1 Key Naming Convention

```
{namespace}:{entity}:{id}:{attribute}
```

### 7.2 Redis Data Structures

#### Session Storage (Hashes)
```redis
# Key: session:{sessionId}
HSET session:abc123 userId "user-uuid-123"
HSET session:abc123 email "user@example.com"
HSET session:abc123 tier "free"
EXPIRE session:abc123 900  # 15 minutes
```

#### Rate Limiting (Sorted Sets)
```redis
# Key: ratelimit:{userId}:{endpoint}
# Score: timestamp, Member: requestId
ZADD ratelimit:user-123:api/analyze 1696800000 "req-1"
ZADD ratelimit:user-123:api/analyze 1696800001 "req-2"
EXPIRE ratelimit:user-123:api/analyze 86400  # 24 hours
```

#### AI Response Cache (Strings)
```redis
# Key: ai:cache:{hash(prompt)}
# Value: JSON response
SET ai:cache:abc123def456 '{"overallScore": 78, ...}' EX 3600
```

#### Job Queue (Bull)
```redis
# Managed by Bull library
bull:ai-generation:waiting
bull:ai-generation:active
bull:ai-generation:completed
bull:ai-generation:failed
```

#### Daily Usage Counter (Strings)
```redis
# Key: usage:{userId}:analyses:{date}
INCR usage:user-123:analyses:2025-10-08
EXPIRE usage:user-123:analyses:2025-10-08 86400  # Reset daily
```

---

## 8. Migrations Strategy

### 8.1 Prisma Migrations

```bash
# Create migration
npx prisma migrate dev --name init

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### 8.2 Migration Files Structure

```
prisma/
├── migrations/
│   ├── 20251008_init/
│   │   └── migration.sql
│   ├── 20251015_add_templates/
│   │   └── migration.sql
│   └── migration_lock.toml
└── schema.prisma
```

### 8.3 Seed Data

**File:** `prisma/seed.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed templates
  const templates = await prisma.template.createMany({
    data: [
      {
        name: 'Classic',
        category: 'traditional',
        design: { /* ... */ },
        atsScore: 95,
        isActive: true,
      },
      // ... more templates
    ],
  });
  
  console.log('Seeded templates:', templates.count);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
```

---

## 9. Data Retention Policy

### 9.1 Retention Periods

| Data Type | Retention Period | Justification |
|-----------|------------------|---------------|
| **Active User Data** | Indefinite | User owns data |
| **Deleted User Data** | 30 days (soft delete) | Allow recovery |
| **Analysis Results** | 90 days | Historical reference |
| **Audit Logs** | 1 year | Compliance |
| **AI Usage Logs** | 90 days | Cost tracking |
| **Error Logs** | 30 days | Debugging |

### 9.2 Cleanup Queries

```sql
-- Delete soft-deleted users after 30 days
DELETE FROM users 
WHERE deleted_at < NOW() - INTERVAL '30 days';

-- Archive old analyses (move to cold storage)
DELETE FROM analyses 
WHERE created_at < NOW() - INTERVAL '90 days'
  AND status = 'completed';

-- Clean up old audit logs
DELETE FROM audit_logs 
WHERE created_at < NOW() - INTERVAL '1 year';
```

### 9.3 Scheduled Jobs

```javascript
// Run daily cleanup
cron.schedule('0 2 * * *', async () => {
  await cleanupOldAnalyses();
  await cleanupSoftDeletedUsers();
  await archiveOldAuditLogs();
});
```

---

## 10. Performance Optimization

### 10.1 Query Optimization Tips

```sql
-- Use EXPLAIN ANALYZE to check query plans
EXPLAIN ANALYZE
SELECT * FROM resumes 
WHERE user_id = 'xxx' AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- Add covering index if needed
CREATE INDEX idx_resumes_user_cover 
ON resumes(user_id, created_at DESC, title) 
WHERE deleted_at IS NULL;
```

### 10.2 Connection Pooling

```typescript
// Prisma connection pooling
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  relationMode = "prisma"
  pool_size = 20  // Adjust based on load
}
```

### 10.3 JSONB Optimization

```sql
-- Index specific JSONB fields
CREATE INDEX idx_resume_skills 
ON resumes USING GIN ((content -> 'skills'));

-- Query optimization
SELECT * FROM resumes
WHERE content @> '{"skills": {"technical": ["Python"]}}';
```

---

**Document Version:** 1.0  
**Last Updated:** October 8, 2025  
**Schema Version:** 1.0.0
