# API Endpoint Specifications
## ATS Resume Platform - RESTful API

**Version:** 1.0  
**Base URL:** `https://api.atsplatform.com/v1`  
**Last Updated:** October 2025

---

## Table of Contents
1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Error Handling](#error-handling)
4. [Rate Limiting](#rate-limiting)
5. [Endpoints](#endpoints)
   - [Auth Endpoints](#auth-endpoints)
   - [User Endpoints](#user-endpoints)
   - [Resume Endpoints](#resume-endpoints)
   - [Template Endpoints](#template-endpoints)
   - [Analysis Endpoints](#analysis-endpoints)
   - [AI Endpoints](#ai-endpoints)
   - [Job Description Endpoints](#job-description-endpoints)
6. [Webhooks](#webhooks)
7. [Websockets](#websockets)

---

## 1. API Overview

### 1.1 Design Principles

- **RESTful**: Standard HTTP methods (GET, POST, PUT, PATCH, DELETE)
- **JSON**: All requests/responses use JSON
- **Versioned**: API version in URL (`/v1/`)
- **Stateless**: JWT-based authentication
- **Paginated**: List endpoints support pagination
- **Filterable**: List endpoints support filtering

### 1.2 Request/Response Format

**Request Headers:**
```http
Content-Type: application/json
Authorization: Bearer {jwt_token}
```

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-10-08T12:00:00Z",
    "requestId": "req_abc123"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "email": "Invalid email format"
    }
  },
  "meta": {
    "timestamp": "2025-10-08T12:00:00Z",
    "requestId": "req_abc123"
  }
}
```

### 1.3 HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing/invalid auth token |
| 403 | Forbidden | No permission for resource |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Server overloaded |

---

## 2. Authentication

### 2.1 JWT Token Structure

```json
{
  "userId": "user-uuid-123",
  "email": "user@example.com",
  "tier": "free",
  "iat": 1696800000,
  "exp": 1696800900
}
```

### 2.2 Token Lifecycle

- **Access Token**: 15 minutes expiry
- **Refresh Token**: 7 days expiry
- **Refresh Token Rotation**: New refresh token on every refresh

### 2.3 Authorization Header

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 3. Error Handling

### 3.1 Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Invalid input data | 400 |
| `UNAUTHORIZED` | Missing/invalid token | 401 |
| `FORBIDDEN` | No permission | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `CONFLICT` | Resource already exists | 409 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `AI_PROVIDER_ERROR` | AI service error | 503 |
| `INTERNAL_ERROR` | Server error | 500 |

### 3.2 Validation Errors

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": "Email is required",
      "password": "Password must be at least 8 characters"
    }
  }
}
```

---

## 4. Rate Limiting

### 4.1 Rate Limits by Tier

| Tier | Per Minute | Per Day | Per Month |
|------|-----------|---------|-----------|
| **Free** | 10 | 100 | 1,000 |
| **Premium** | 60 | 1,000 | 50,000 |
| **Admin** | Unlimited | Unlimited | Unlimited |

### 4.2 Rate Limit Headers

```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 5
X-RateLimit-Reset: 1696800900
```

### 4.3 Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again later.",
    "details": {
      "retryAfter": 60
    }
  }
}
```

---

## 5. Endpoints

---

## 5.1 Auth Endpoints

### POST /auth/register

**Description:** Register a new user

**Authentication:** None

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid-123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "subscriptionTier": "free",
      "createdAt": "2025-10-08T12:00:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc...",
      "expiresIn": 900
    }
  }
}
```

**Validation Rules:**
- Email: Valid format, unique
- Password: Min 8 chars, 1 uppercase, 1 lowercase, 1 number
- First/Last Name: Optional, max 100 chars

---

### POST /auth/login

**Description:** Login user

**Authentication:** None

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid-123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "subscriptionTier": "free"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc...",
      "expiresIn": 900
    }
  }
}
```

**Error Cases:**
- 401: Invalid credentials
- 429: Too many login attempts

---

### POST /auth/refresh

**Description:** Refresh access token

**Authentication:** Refresh token in body

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 900
  }
}
```

---

### POST /auth/logout

**Description:** Logout user (invalidate refresh token)

**Authentication:** Required

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response (204 No Content)**

---

### POST /auth/forgot-password

**Description:** Request password reset

**Authentication:** None

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Password reset email sent"
  }
}
```

---

### POST /auth/reset-password

**Description:** Reset password with token

**Authentication:** None (uses reset token)

**Request Body:**
```json
{
  "token": "reset-token-123",
  "newPassword": "NewSecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Password reset successful"
  }
}
```

---

## 5.2 User Endpoints

### GET /users/me

**Description:** Get current user profile

**Authentication:** Required

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid-123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "profilePictureUrl": "https://cdn.example.com/profile.jpg",
      "subscriptionTier": "free",
      "subscriptionEndDate": null,
      "resumesCreated": 3,
      "analysesRunToday": 2,
      "aiGenerationsToday": 5,
      "limits": {
        "maxResumes": 5,
        "analysesPerDay": 5,
        "aiGenerationsPerDay": 20
      },
      "createdAt": "2025-10-08T12:00:00Z",
      "lastLoginAt": "2025-10-08T14:00:00Z"
    }
  }
}
```

---

### PATCH /users/me

**Description:** Update current user profile

**Authentication:** Required

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "settings": {
    "theme": "dark",
    "notifications": false
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": { /* updated user object */ }
  }
}
```

---

### POST /users/me/profile-picture

**Description:** Upload profile picture

**Authentication:** Required

**Content-Type:** multipart/form-data

**Request Body:**
```
profilePicture: [binary file]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "profilePictureUrl": "https://cdn.example.com/profile-new.jpg"
  }
}
```

---

### DELETE /users/me

**Description:** Delete current user account (soft delete)

**Authentication:** Required

**Request Body:**
```json
{
  "password": "SecurePass123!"
}
```

**Response (204 No Content)**

---

## 5.3 Resume Endpoints

### GET /resumes

**Description:** Get all resumes for current user

**Authentication:** Required

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10, max: 50)
- `status` (filter: draft, published, archived)
- `sortBy` (createdAt, updatedAt, title)
- `sortOrder` (asc, desc)

**Example:** `/resumes?page=1&limit=10&status=published&sortBy=updatedAt&sortOrder=desc`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "resumes": [
      {
        "id": "resume-uuid-123",
        "title": "Software Engineer Resume",
        "templateId": "template-uuid-1",
        "template": {
          "name": "Modern",
          "category": "tech"
        },
        "status": "published",
        "optimizationScore": 78,
        "version": 3,
        "createdAt": "2025-10-01T12:00:00Z",
        "updatedAt": "2025-10-08T14:00:00Z"
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "pages": 3
    }
  }
}
```

---

### GET /resumes/:id

**Description:** Get single resume by ID

**Authentication:** Required

**Path Parameters:**
- `id`: Resume UUID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "resume": {
      "id": "resume-uuid-123",
      "title": "Software Engineer Resume",
      "templateId": "template-uuid-1",
      "template": {
        "name": "Modern",
        "design": { /* template design JSON */ }
      },
      "content": {
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
            "current": false,
            "bullets": [
              "Developed scalable microservices...",
              "Led team of 5 engineers..."
            ]
          }
        ],
        "education": [
          {
            "degree": "Bachelor of Science",
            "field": "Computer Science",
            "school": "Stanford University",
            "location": "Stanford, CA",
            "graduationDate": "2019-05",
            "gpa": "3.8"
          }
        ],
        "skills": {
          "technical": ["Python", "React", "AWS", "Docker"],
          "soft": ["Leadership", "Communication"]
        },
        "projects": [],
        "certifications": []
      },
      "extractedText": "John Doe john@example.com...",
      "status": "published",
      "version": 3,
      "createdAt": "2025-10-01T12:00:00Z",
      "updatedAt": "2025-10-08T14:00:00Z"
    }
  }
}
```

---

### POST /resumes

**Description:** Create new resume

**Authentication:** Required

**Request Body:**
```json
{
  "title": "Software Engineer Resume",
  "templateId": "template-uuid-1",
  "content": {
    "personalInfo": { /* ... */ },
    "summary": "...",
    "experience": [ /* ... */ ],
    "education": [ /* ... */ ],
    "skills": { /* ... */ }
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "resume": {
      "id": "resume-uuid-new",
      "title": "Software Engineer Resume",
      /* ... full resume object ... */
    }
  }
}
```

**Error Cases:**
- 403: Resume limit reached (free tier: 5 resumes)

---

### PATCH /resumes/:id

**Description:** Update resume

**Authentication:** Required

**Path Parameters:**
- `id`: Resume UUID

**Request Body:**
```json
{
  "title": "Updated Title",
  "content": {
    "summary": "Updated summary..."
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "resume": { /* updated resume */ },
    "versionCreated": true,
    "newVersion": 4
  }
}
```

---

### DELETE /resumes/:id

**Description:** Delete resume (soft delete)

**Authentication:** Required

**Path Parameters:**
- `id`: Resume UUID

**Response (204 No Content)**

---

### POST /resumes/upload

**Description:** Upload resume file (PDF/DOCX) for parsing

**Authentication:** Required

**Content-Type:** multipart/form-data

**Request Body:**
```
resume: [binary file]
title: "Software Engineer Resume" (optional)
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "resume": {
      "id": "resume-uuid-new",
      "title": "Uploaded Resume",
      "content": { /* parsed content */ },
      "extractedText": "...",
      "originalFileUrl": "https://cdn.example.com/uploaded.pdf"
    }
  }
}
```

**Error Cases:**
- 400: Invalid file type (only PDF, DOCX)
- 400: File too large (max 5MB)
- 500: Failed to parse file

---

### GET /resumes/:id/versions

**Description:** Get version history for resume

**Authentication:** Required

**Path Parameters:**
- `id`: Resume UUID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "versions": [
      {
        "id": "version-uuid-1",
        "versionNumber": 3,
        "changeSummary": "AI optimization applied",
        "changeType": "ai_optimized",
        "createdAt": "2025-10-08T14:00:00Z"
      },
      {
        "id": "version-uuid-2",
        "versionNumber": 2,
        "changeSummary": "Manual edit: Updated experience",
        "changeType": "manual",
        "createdAt": "2025-10-05T10:00:00Z"
      }
    ]
  }
}
```

---

### POST /resumes/:id/revert

**Description:** Revert resume to specific version

**Authentication:** Required

**Path Parameters:**
- `id`: Resume UUID

**Request Body:**
```json
{
  "versionNumber": 2
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "resume": { /* reverted resume */ },
    "revertedTo": 2,
    "newVersion": 4
  }
}
```

---

### POST /resumes/:id/export

**Description:** Export resume as PDF or DOCX

**Authentication:** Required

**Path Parameters:**
- `id`: Resume UUID

**Query Parameters:**
- `format`: pdf or docx (default: pdf)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://cdn.example.com/resumes/exported-resume.pdf",
    "expiresAt": "2025-10-08T15:00:00Z"
  }
}
```

---

## 5.4 Template Endpoints

### GET /templates

**Description:** Get all available templates

**Authentication:** Required

**Query Parameters:**
- `category` (filter: classic, modern, tech, creative, ats-optimized)
- `isPremium` (filter: true, false)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "template-uuid-1",
        "name": "Modern",
        "description": "Clean and contemporary design",
        "category": "modern",
        "previewImageUrl": "https://cdn.example.com/previews/modern.png",
        "isPremium": false,
        "atsScore": 88,
        "usageCount": 1542
      }
    ]
  }
}
```

---

### GET /templates/:id

**Description:** Get single template with full design

**Authentication:** Required

**Path Parameters:**
- `id`: Template UUID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "template": {
      "id": "template-uuid-1",
      "name": "Modern",
      "description": "Clean and contemporary design",
      "category": "modern",
      "design": {
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
      },
      "previewImageUrl": "https://cdn.example.com/previews/modern.png",
      "isPremium": false,
      "atsScore": 88
    }
  }
}
```

---

## 5.5 Analysis Endpoints

### POST /analyses

**Description:** Analyze resume against job description

**Authentication:** Required

**Request Body:**
```json
{
  "resumeId": "resume-uuid-123",
  "jobDescriptionId": "jd-uuid-456", // optional, can provide inline
  "jobDescription": "We are seeking a Software Engineer...", // optional if jobDescriptionId provided
  "analysisType": "full_analysis" // options: ats_score, keyword_match, full_analysis
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "analysis": {
      "id": "analysis-uuid-789",
      "resumeId": "resume-uuid-123",
      "jobDescriptionId": "jd-uuid-456",
      "analysisType": "full_analysis",
      "status": "processing",
      "createdAt": "2025-10-08T14:00:00Z"
    }
  }
}
```

**Note:** Analysis is processed asynchronously. Poll `/analyses/:id` for results.

**Error Cases:**
- 403: Daily analysis limit reached (free tier: 5/day)
- 503: AI provider unavailable

---

### GET /analyses/:id

**Description:** Get analysis results

**Authentication:** Required

**Path Parameters:**
- `id`: Analysis UUID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "analysis": {
      "id": "analysis-uuid-789",
      "resumeId": "resume-uuid-123",
      "jobDescriptionId": "jd-uuid-456",
      "analysisType": "full_analysis",
      "status": "completed",
      "results": {
        "overallScore": 78,
        "keywordAnalysis": {
          "foundKeywords": ["Python", "React", "AWS", "Docker"],
          "missingKeywords": ["Kubernetes", "GraphQL", "TypeScript"]
        },
        "experienceRelevance": {
          "summary": "Your experience shows strong alignment with the core requirements...",
          "details": [
            {
              "jdRequirement": "3+ years of software development",
              "resumeEvidence": "5 years of experience as Senior Developer at Tech Corp",
              "matchStrength": "Strong"
            },
            {
              "jdRequirement": "Experience with cloud platforms (AWS)",
              "resumeEvidence": "Deployed applications on AWS using EC2, S3, Lambda",
              "matchStrength": "Strong"
            },
            {
              "jdRequirement": "Knowledge of Kubernetes",
              "resumeEvidence": "No direct evidence found",
              "matchStrength": "Weak"
            }
          ]
        },
        "atsFormattingScore": {
          "score": 85,
          "feedback": "Resume has good ATS compatibility. Format is clean with standard fonts..."
        },
        "actionableAdvice": [
          "Add Kubernetes and container orchestration experience if applicable",
          "Include TypeScript in your technical skills list",
          "Quantify achievements in your bullet points (e.g., 'Improved performance by 40%')"
        ]
      },
      "aiProvider": "openai",
      "modelUsed": "gpt-4",
      "processingTimeMs": 3450,
      "createdAt": "2025-10-08T14:00:00Z",
      "completedAt": "2025-10-08T14:00:03Z"
    }
  }
}
```

**Status Values:**
- `pending`: In queue
- `processing`: AI analyzing
- `completed`: Done
- `failed`: Error occurred

---

### GET /analyses

**Description:** Get analysis history for current user

**Authentication:** Required

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `resumeId` (filter by resume)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "analyses": [
      {
        "id": "analysis-uuid-789",
        "resume": {
          "id": "resume-uuid-123",
          "title": "Software Engineer Resume"
        },
        "jobDescription": {
          "id": "jd-uuid-456",
          "title": "Senior Software Engineer"
        },
        "results": {
          "overallScore": 78
        },
        "status": "completed",
        "createdAt": "2025-10-08T14:00:00Z"
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 10,
      "pages": 2
    }
  }
}
```

---

## 5.6 AI Endpoints

### POST /ai/generate-bullets

**Description:** Generate bullet points for experience/project

**Authentication:** Required

**Request Body:**
```json
{
  "context": {
    "jobTitle": "Software Engineer",
    "company": "Tech Corp",
    "description": "Worked on backend services",
    "skills": ["Python", "AWS"]
  },
  "count": 3
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "bullets": [
      "Developed and maintained scalable microservices using Python and AWS Lambda",
      "Optimized database queries, reducing response time by 40%",
      "Collaborated with cross-functional teams to deliver features on schedule"
    ],
    "aiProvider": "gemini",
    "tokensUsed": 150
  }
}
```

**Error Cases:**
- 403: Daily AI generation limit reached (free tier: 20/day)

---

### POST /ai/optimize-content

**Description:** Optimize resume content for job description

**Authentication:** Required

**Request Body:**
```json
{
  "content": "Worked on various projects using Python",
  "jobDescription": "We need a Python expert with FastAPI experience",
  "contentType": "bullet" // options: bullet, summary, skill
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "original": "Worked on various projects using Python",
    "optimized": "Developed multiple applications using Python and FastAPI framework",
    "improvements": [
      "More specific about technologies",
      "Added relevant keyword (FastAPI)",
      "Stronger action verb"
    ]
  }
}
```

---

### POST /ai/generate-summary

**Description:** Generate professional summary

**Authentication:** Required

**Request Body:**
```json
{
  "experience": [
    {
      "title": "Software Engineer",
      "company": "Tech Corp",
      "years": 3
    }
  ],
  "skills": ["Python", "AWS", "React"],
  "targetRole": "Senior Software Engineer"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "summary": "Results-driven Software Engineer with 3+ years of experience developing scalable applications. Proficient in Python, AWS, and React with a proven track record of delivering high-quality solutions. Seeking to leverage technical expertise and leadership skills in a Senior Software Engineer role."
  }
}
```

---

### POST /ai/suggest-skills

**Description:** Suggest relevant skills based on experience

**Authentication:** Required

**Request Body:**
```json
{
  "experience": [
    {
      "title": "Software Engineer",
      "description": "Developed web applications using React and Node.js"
    }
  ],
  "targetRole": "Full Stack Developer"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "suggestedSkills": {
      "technical": ["TypeScript", "GraphQL", "MongoDB", "Docker"],
      "soft": ["Agile methodology", "Code review", "Mentoring"]
    },
    "reasoning": {
      "TypeScript": "Common requirement for modern React/Node.js stacks",
      "GraphQL": "Increasingly popular for API development"
    }
  }
}
```

---

## 5.7 Job Description Endpoints

### POST /job-descriptions

**Description:** Save job description

**Authentication:** Required

**Request Body:**
```json
{
  "title": "Senior Software Engineer",
  "company": "Tech Corp",
  "location": "San Francisco, CA",
  "description": "We are seeking a Senior Software Engineer...",
  "sourceUrl": "https://careers.techcorp.com/job/12345"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "jobDescription": {
      "id": "jd-uuid-456",
      "title": "Senior Software Engineer",
      "company": "Tech Corp",
      "extractedData": {
        "requiredSkills": ["Python", "AWS", "Docker"],
        "preferredSkills": ["Kubernetes", "GraphQL"],
        "requiredExperience": "3+ years",
        "keywords": ["software", "engineer", "cloud", "scalable"]
      },
      "createdAt": "2025-10-08T14:00:00Z"
    }
  }
}
```

---

### GET /job-descriptions

**Description:** Get saved job descriptions

**Authentication:** Required

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "jobDescriptions": [
      {
        "id": "jd-uuid-456",
        "title": "Senior Software Engineer",
        "company": "Tech Corp",
        "location": "San Francisco, CA",
        "createdAt": "2025-10-08T14:00:00Z"
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 10,
      "pages": 1
    }
  }
}
```

---

### GET /job-descriptions/:id

**Description:** Get single job description

**Authentication:** Required

**Path Parameters:**
- `id`: Job Description UUID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "jobDescription": {
      "id": "jd-uuid-456",
      "title": "Senior Software Engineer",
      "company": "Tech Corp",
      "location": "San Francisco, CA",
      "description": "Full job description text...",
      "extractedData": {
        "requiredSkills": ["Python", "AWS"],
        "preferredSkills": ["Kubernetes"],
        "requiredExperience": "3+ years"
      },
      "sourceUrl": "https://careers.techcorp.com/job/12345",
      "createdAt": "2025-10-08T14:00:00Z"
    }
  }
}
```

---

### DELETE /job-descriptions/:id

**Description:** Delete job description

**Authentication:** Required

**Path Parameters:**
- `id`: Job Description UUID

**Response (204 No Content)**

---

## 6. Webhooks

### 6.1 Webhook Events

| Event | Trigger |
|-------|---------|
| `analysis.completed` | Analysis finished |
| `analysis.failed` | Analysis error |
| `resume.exported` | PDF/DOCX export ready |
| `subscription.updated` | Plan changed |

### 6.2 Webhook Payload

```json
{
  "event": "analysis.completed",
  "data": {
    "analysisId": "analysis-uuid-789",
    "resumeId": "resume-uuid-123",
    "overallScore": 78
  },
  "timestamp": "2025-10-08T14:00:03Z",
  "signature": "sha256=..."
}
```

### 6.3 Webhook Registration

**POST /webhooks**

```json
{
  "url": "https://yourapp.com/webhook",
  "events": ["analysis.completed", "analysis.failed"],
  "secret": "your-webhook-secret"
}
```

---

## 7. WebSockets

### 7.1 Connection

**Endpoint:** `wss://api.atsplatform.com/v1/ws`

**Authentication:** Query parameter `?token=jwt_token`

### 7.2 Events

#### analysis_status

**Server → Client:**
```json
{
  "event": "analysis_status",
  "data": {
    "analysisId": "analysis-uuid-789",
    "status": "processing",
    "progress": 45
  }
}
```

#### auto_save

**Client → Server:**
```json
{
  "event": "auto_save",
  "data": {
    "resumeId": "resume-uuid-123",
    "content": { /* partial update */ }
  }
}
```

---

## Appendix: Code Examples

### A. API Client Setup (JavaScript)

```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://api.atsplatform.com/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      const { data } = await axios.post('/auth/refresh', { refreshToken });
      localStorage.setItem('accessToken', data.accessToken);
      error.config.headers.Authorization = `Bearer ${data.accessToken}`;
      return apiClient.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

### B. Rate Limit Handling

```javascript
async function makeRequestWithRetry(requestFn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['x-ratelimit-reset'];
        const delay = retryAfter ? (retryAfter - Date.now()) : 1000 * (i + 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

**Document Version:** 1.0  
**Last Updated:** October 8, 2025  
**API Version:** v1
