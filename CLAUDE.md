# CLAUDE.md - ATS Resume Analyzer Project Guide

This document provides a comprehensive guide for AI assistants (like Claude) working on this codebase.

## Project Overview

**ATS Resume Analyzer** is a full-stack web application that helps job seekers optimize their resumes for Applicant Tracking Systems (ATS). It uses AI-powered analysis to compare resumes against job descriptions and provides actionable feedback.

### Key Features
- **AI-Powered Resume Analysis**: Analyzes resumes against job descriptions using OpenRouter API (free models)
- **Resume Management**: Create, store, and manage multiple resumes (PDF/DOCX upload or manual entry)
- **ATS Scoring**: Overall match score, keyword analysis, formatting score, experience relevance
- **Export Functionality**: Export resumes to PDF and Word formats
- **User Authentication**: JWT-based auth with access/refresh tokens
- **Dark/Light Theme**: Persistent theme preference
- **Responsive Design**: Mobile-first UI with glassmorphism design

---

## Tech Stack

### Backend (`/ats-backend`)
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript
- **Database**: SQLite (default) or PostgreSQL via Prisma ORM
- **Authentication**: JWT (jsonwebtoken) + bcrypt
- **File Processing**: 
  - `pdf-parse` for PDF text extraction
  - `mammoth` for DOCX text extraction
  - `puppeteer` for PDF generation
  - `docx` for Word document generation
- **AI Integration**: OpenAI SDK configured for OpenRouter API
- **Validation**: express-validator + zod

### Frontend (`/ats-frontend`)
- **Framework**: React 18 with Vite
- **Routing**: React Router v7
- **State Management**: Zustand (persisted auth store)
- **Styling**: Tailwind CSS with custom glassmorphism classes
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios with interceptors for token refresh
- **Icons**: Lucide React

---

## Project Structure

```
/ats-backend
├── src/
│   ├── index.ts              # Express app entry point
│   ├── middleware/
│   │   └── auth.middleware.ts # JWT authentication
│   ├── routes/
│   │   ├── ai.routes.ts       # /api/analyze, /api/models
│   │   ├── auth.routes.ts     # /api/auth/*
│   │   ├── resume.routes.ts   # /api/resumes/*
│   │   └── template.routes.ts # /api/templates/*
│   └── services/
│       ├── ai.service.ts       # OpenRouter AI integration
│       ├── auth.service.ts     # User auth logic
│       ├── file-storage.service.ts # File system operations
│       ├── resume-file.service.ts  # Resume file processing
│       ├── resume.service.ts   # Resume CRUD + exports
│       └── template.service.ts # Template management
├── prisma/
│   └── schema.prisma          # Database schema (9 models)
└── uploads/resumes/           # User-uploaded resume files

/ats-frontend
├── src/
│   ├── App.jsx                # Router setup
│   ├── index.jsx              # React entry point
│   ├── index.css              # Tailwind + custom styles
│   ├── components/            # Reusable UI components
│   │   ├── AnalysisResults.jsx
│   │   ├── FileUpload.jsx
│   │   ├── ModelSelector.jsx
│   │   ├── ModelParameters.jsx
│   │   ├── ResumeForm.jsx
│   │   ├── ResumeList.jsx
│   │   └── ScoreRing.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx      # Main app layout
│   │   ├── AnalysisDashboard.jsx # ATS analysis tab
│   │   ├── AnalysisPage.jsx   # Analysis results view
│   │   ├── ResumeManagementPage.jsx
│   │   ├── HistoryPage.jsx
│   │   ├── Login.jsx
│   │   └── SignUp.jsx
│   ├── services/
│   │   ├── api.js             # Axios instance + API functions
│   │   └── authService.js     # Auth-specific API calls
│   ├── stores/
│   │   └── authStore.js       # Zustand auth state
│   └── hooks/
│       └── useTheme.js        # Dark/light mode hook
```

---

## Database Schema (Prisma)

### Core Models
1. **User** - Authentication, profile, subscription tracking
2. **Resume** - User resumes with file storage references
3. **ResumeVersion** - Version history for resumes
4. **Template** - Resume templates with design/structure
5. **JobDescription** - Saved job descriptions
6. **Analysis** - ATS analysis results
7. **AiUsage** - AI usage tracking
8. **Subscription** - User subscription info
9. **AuditLog** - Action logging

### Key Relationships
- User → Resumes (1:many)
- User → Analyses (1:many)
- Resume → Analyses (1:many)
- Resume → Template (many:1)
- JobDescription → Analyses (1:many)

---

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Create new user
- `POST /login` - Authenticate user
- `POST /refresh` - Refresh access token
- `GET /me` - Get current user (protected)

### AI Analysis (`/api`)
- `GET /models` - List available AI models (cached 24h)
- `POST /models/refresh` - Force refresh model cache
- `POST /analyze` - Analyze resume against job description (protected)

### Resumes (`/api/resumes`)
- `GET /` - List user's resumes (paginated)
- `POST /` - Create resume (file upload or text)
- `GET /:id` - Get resume details
- `PATCH /:id` - Update resume
- `DELETE /:id` - Soft delete resume
- `GET /:id/file` - Download original file
- `GET /:id/export/pdf` - Export as PDF
- `GET /:id/export/word` - Export as DOCX
- `POST /parse` - Parse resume text with AI

### Templates (`/api/templates`)
- `GET /` - List templates
- `GET /:id` - Get template details
- `POST /seed` - Seed default templates

---

## Environment Variables

### Backend (`.env`)
```env
# Database
DATABASE_PROVIDER=sqlite  # or postgresql
DATABASE_URL=file:./dev.db  # or postgres connection string

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# AI (OpenRouter)
OPENAI_API_KEY=your-openrouter-api-key
BASE_URL=https://openrouter.ai/api/v1
ANALYSIS_MODEL=google/gemini-2.0-flash-exp:free

# Server
PORT=3001
```

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:3001
```

---

## Development Commands

### Backend
```bash
cd ats-backend
npm install
npm run prisma:generate   # Generate Prisma client
npm run prisma:migrate    # Run migrations
npm run dev               # Start dev server (nodemon)
npm run build             # Compile TypeScript
npm start                 # Run production build
```

### Frontend
```bash
cd ats-frontend
npm install
npm run dev               # Start Vite dev server (port 3000)
npm run build             # Build for production
npm run preview           # Preview production build
```

---

## Key Implementation Details

### AI Analysis Flow
1. User uploads resume (PDF/DOCX) + pastes job description
2. Frontend sends to `POST /api/analyze` with optional model parameters
3. Backend extracts text from resume file
4. `AIService.analyzeResume()` sends prompt to OpenRouter
5. Response parsed as JSON with scores and recommendations
6. Analysis saved to database, returned to frontend

### Model Parameters (Advanced Settings)
- **Temperature** (0.0-2.0): Controls response creativity
- **Max Tokens** (500-16000): Controls response length
- **Include Reasoning**: Enables step-by-step AI explanations

### Authentication Flow
- Login/Register returns access token (15min) + refresh token (7d)
- Axios interceptor auto-refreshes expired access tokens
- Auth state persisted in localStorage via Zustand

### File Storage
- Uploads stored at `/ats-backend/uploads/resumes/{userId}/{fileId}.{ext}`
- File metadata stored in Resume model (originalFileId, originalFileName, etc.)
- Text extraction happens on upload for ATS analysis

---

## Code Patterns & Conventions

### Backend
- Services handle business logic, routes handle HTTP
- All routes use async/await with try-catch error handling
- Prisma client instantiated per-service (could be optimized)
- Response format: `{ success: true, data: {...} }` or `{ error: "..." }`

### Frontend
- Components use functional style with hooks
- `useCallback` and `useMemo` for performance optimization
- Form state managed locally with controlled inputs
- API calls centralized in `/services/api.js`

### Styling
- Custom glassmorphism classes: `.glass`, `.glass-strong`, `.hover-glass`
- Gradient buttons: `.btn-glass`
- Dark mode via Tailwind `dark:` prefix
- Animations: `.slide-up`, `.fade-in`, `.animate-pulse`

---

## Common Tasks

### Adding a New API Endpoint
1. Create/update route file in `/ats-backend/src/routes/`
2. Create/update service file in `/ats-backend/src/services/`
3. Add route to `/ats-backend/src/index.ts`
4. Add API function in `/ats-frontend/src/services/api.js`

### Adding a New Database Model
1. Update `/ats-backend/prisma/schema.prisma`
2. Run `npm run prisma:migrate`
3. Run `npm run prisma:generate`

### Adding a New React Component
1. Create component in `/ats-frontend/src/components/`
2. Import and use in page component
3. Follow existing patterns for styling and state

### Modifying AI Analysis Prompt
- Edit prompt in `AIService.analyzeResume()` method
- JSON response schema is defined in the prompt
- Formatting rules and scoring guidelines are embedded

---

## Testing & Debugging

### Backend
- Health check: `GET /health`
- Check Prisma Studio: `npm run prisma:studio`
- Logs appear in terminal during `npm run dev`

### Frontend
- React DevTools for component inspection
- Network tab for API calls
- Console logs for auth flow debugging

### Common Issues
1. **CORS errors**: Backend has `cors()` middleware enabled
2. **Token expired**: Interceptor should auto-refresh
3. **File upload fails**: Check multer config (5MB limit, PDF/DOCX only)
4. **AI analysis timeout**: 60s timeout in axios config

---

## Deployment Notes

- Backend serves static frontend from `/build` directory
- Run `npm run build` in frontend, copy output to backend's `build/`
- Backend serves React app at root path (`/`)
- Configure environment variables for production
- Consider Redis for session/cache in production

---

## Future Enhancements (TODOs in Code)
- Admin role check for template seeding
- Email verification flow
- Stripe integration for subscriptions
- Real-time WebSocket updates
- Resume template builder UI
- Batch analysis feature
