# AI Agent Build Instructions
## ATS Resume Platform - Step-by-Step Implementation Guide

**Version:** 1.0  
**Last Updated:** October 8, 2025  
**Purpose:** Guide AI agent through building the ATS platform feature by feature

---

## 📋 Table of Contents
1. [Current State](#current-state)
2. [How to Use This File](#how-to-use-this-file)
3. [Project Context](#project-context)
4. [Feature Breakdown](#feature-breakdown)
5. [Verification Checklist](#verification-checklist)

---

## 🎯 Current State

### Existing Codebase

**What We Have:**
```
✅ Backend (ats-backend/)
   ✅ Express server setup (TypeScript)
   ✅ Authentication system (JWT, bcrypt)
   ✅ Prisma ORM with PostgreSQL
   ✅ Resume upload endpoint
   ✅ PDF/DOCX parsing (pdf-parse, mammoth)
   ✅ OpenAI integration for analysis
   ✅ CORS configuration
   ✅ Multer file upload

✅ Frontend (ats-frontend/)
   ✅ React app with Create React App
   ✅ Tailwind CSS configured
   ✅ Glassmorphism design system
   ✅ Theme toggle (light/dark)
   ✅ Authentication system (Zustand, React Router)
   ✅ Login/Signup pages
   ✅ Protected routes
   ✅ Resume upload component
   ✅ Job description input
   ✅ Analysis results display
   ✅ Animated UI components
```

**Current Features Working:**
- ✅ User authentication (register/login/logout)
- ✅ JWT token management with refresh
- ✅ Protected routes and auth state
- ✅ Database persistence (9 models)
- ✅ Resume CRUD operations (backend)
- ✅ ATS Resume Analysis (file upload, AI analysis, results display)
- ✅ AI model fetching and selection
- ✅ File upload (PDF/DOCX)
- ✅ Text extraction from resumes
- ✅ AI-powered analysis (basic)
- ✅ Keyword matching
- ✅ ATS scoring
- ✅ Results display with beautiful UI

**What's Missing (To Build):**
- ❌ Resume CRUD operations
- ❌ Resume builder
- ❌ Template system
- ❌ Version control
- ❌ AI content generation
- ❌ AI content optimization
- ❌ Export (PDF/DOCX)
- ❌ User dashboard
- ❌ Profile management
- ❌ Rate limiting
- ❌ Usage tracking

---

## 📖 How to Use This File

### For AI Agents (Cursor, Copilot, etc.)

**Instructions:**
1. Read this file completely before starting any feature
2. Work on ONE feature at a time in order
3. Mark checkboxes as you complete tasks
4. Verify each feature works before moving to next
5. Update "Current State" section as you progress
6. Reference documentation files when needed

**Working Process:**
```
For each feature:
1. Read feature requirements
2. Check dependencies completed
3. Read relevant documentation
4. Implement code
5. Test thoroughly
6. Mark checkbox as done
7. Update current state
8. Move to next feature
```

**Testing After Each Feature:**
```bash
# Backend
cd backend
npm test
npm run dev  # Manual testing

# Frontend
cd frontend
npm test
npm run dev  # Manual testing
```

---

## 🎯 Project Context

### Tech Stack Summary

**Backend:**
- Node.js + Express
- PostgreSQL + Prisma
- Redis (sessions, cache)
- JWT authentication
- OpenAI/Gemini API

**Frontend:**
- React 18 + Vite
- Tailwind CSS
- Zustand (state)
- React Query (data fetching)
- Axios (HTTP client)

### Documentation Reference

```
📁 ATS_PROJECT_DOCS/
├── 01_TECHNICAL_ARCHITECTURE.md  → System design
├── 02_DATABASE_SCHEMA.md         → Database & Prisma schema
├── 03_API_ENDPOINTS.md           → API specifications
├── 04_UI_UX_WIREFRAMES.md        → UI designs
└── 05_IMPLEMENTATION_ROADMAP.md  → Timeline & guide
```

---

## 🏗️ Feature Breakdown

---

## PHASE 1: FOUNDATION (Week 1-2)

### Feature 1.1: Database Setup
**Priority:** CRITICAL  
**Estimated Time:** 2 hours  
**Dependencies:** None

**Requirements:**
- [x] Install Prisma
- [x] Create Prisma schema (copy from 02_DATABASE_SCHEMA.md)
- [x] Set up PostgreSQL connection
- [x] Create initial migration
- [x] Test database connection

**Implementation Steps:**

```bash
# 1. Install Prisma
cd backend
npm install prisma @prisma/client
npm install --save-dev typescript ts-node @types/node

# 2. Initialize Prisma
npx prisma init
```

**Code to Add:**

File: `backend/prisma/schema.prisma`
```prisma
// Copy the complete schema from 02_DATABASE_SCHEMA.md
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                    String    @id @default(uuid()) @db.Uuid
  email                 String    @unique @db.VarChar(255)
  emailVerified         Boolean   @default(false) @map("email_verified")
  passwordHash          String    @map("password_hash") @db.VarChar(255)
  // ... (copy rest from docs)
}

// ... (copy all other models)
```

File: `backend/.env`
```env
DATABASE_URL="postgresql://user:password@localhost:5432/ats_platform?schema=public"
```

**Testing:**
```bash
# Create migration
npx prisma migrate dev --name init

# Open Prisma Studio
npx prisma studio

# Verify tables created
```

**Verification Checklist:**
- [x] Prisma schema created
- [x] Migration runs successfully
- [x] Can open Prisma Studio
- [x] All tables visible in database

**Documentation:** See `02_DATABASE_SCHEMA.md` sections 3-6

---

### Feature 1.2: Authentication Backend
**Priority:** CRITICAL  
**Estimated Time:** 4-6 hours  
**Dependencies:** Feature 1.1 (Database)

**Requirements:**
- [x] User registration endpoint
- [x] Login endpoint
- [x] JWT token generation
- [x] Password hashing (bcrypt)
- [x] Refresh token mechanism
- [x] Auth middleware
- [x] Input validation

**Implementation Steps:**

**1. Install Dependencies:**
```bash
cd backend
npm install bcrypt jsonwebtoken
npm install zod express-validator
npm install --save-dev @types/bcrypt @types/jsonwebtoken
```

**2. Create Auth Service:**

File: `backend/src/services/auth.service.ts`
```typescript
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AuthService {
  async register(email: string, password: string, firstName?: string, lastName?: string) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
      },
    });

    // Generate tokens
    const accessToken = this.generateAccessToken(user.id, email);
    const refreshToken = this.generateRefreshToken(user.id);

    return { user, accessToken, refreshToken };
  }

  async login(email: string, password: string) {
    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const accessToken = this.generateAccessToken(user.id, user.email);
    const refreshToken = this.generateRefreshToken(user.id);

    return { user, accessToken, refreshToken };
  }

  private generateAccessToken(userId: string, email: string): string {
    return jwt.sign(
      { userId, email },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );
  }

  private generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );
  }

  verifyAccessToken(token: string) {
    return jwt.verify(token, process.env.JWT_SECRET!);
  }
}
```

**3. Create Auth Middleware:**

File: `backend/src/middleware/auth.middleware.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

**4. Create Auth Routes:**

File: `backend/src/routes/auth.routes.ts`
```typescript
import { Router } from 'express';
import { AuthService } from '../services/auth.service';

const router = Router();
const authService = new AuthService();

router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await authService.register(email, password, firstName, lastName);
    
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
        },
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      },
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await authService.login(email, password);
    
    res.json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
        },
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      },
    });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

export default router;
```

**5. Update Main Server:**

File: `backend/src/index.ts`
```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**6. Add Environment Variables:**

File: `backend/.env`
```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
```

**Testing:**
```bash
# Start server
npm run dev

# Test registration (using curl or Postman)
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","firstName":"Test","lastName":"User"}'

# Test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

**Verification Checklist:**
- [x] Registration endpoint works
- [x] Login endpoint works
- [x] JWT tokens generated
- [x] Password hashed in database
- [x] Auth middleware blocks unauthorized requests
- [x] Error messages appropriate

**Documentation:** See `03_API_ENDPOINTS.md` section 5.1

---

### Feature 1.3: Authentication Frontend
**Priority:** CRITICAL  
**Estimated Time:** 4-6 hours  
**Dependencies:** Feature 1.2 (Auth Backend)

**Requirements:**
- [ ] Login page
- [ ] Sign up page
- [ ] Auth context/store
- [ ] Token storage (localStorage)
- [ ] Protected routes
- [ ] API client with auth interceptor

**Implementation Steps:**

**1. Install Dependencies:**
```bash
cd frontend
npm install zustand axios react-router-dom
npm install react-hook-form zod @hookform/resolvers
```

**2. Create Auth Store:**

File: `frontend/src/stores/authStore.js`
```javascript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },

      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

export default useAuthStore;
```

**3. Create API Client:**

File: `frontend/src/services/api.js`
```javascript
import axios from 'axios';
import useAuthStore from '../stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data.data;
        useAuthStore.getState().setAuth(
          useAuthStore.getState().user,
          accessToken,
          refreshToken
        );

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

**4. Create Auth Service:**

File: `frontend/src/services/authService.js`
```javascript
import apiClient from './api';

export const authService = {
  async register(email, password, firstName, lastName) {
    const response = await apiClient.post('/api/auth/register', {
      email,
      password,
      firstName,
      lastName,
    });
    return response.data.data;
  },

  async login(email, password) {
    const response = await apiClient.post('/api/auth/login', {
      email,
      password,
    });
    return response.data.data;
  },

  async logout() {
    // Optional: call backend logout endpoint
    // await apiClient.post('/api/auth/logout');
  },
};
```

**5. Create Login Page:**

File: `frontend/src/pages/Login.jsx`
```jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { authService } from '../services/authService';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authService.login(email, password);
      setAuth(data.user, data.tokens.accessToken, data.tokens.refreshToken);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen animated-bg paper-texture flex items-center justify-center px-4">
      <div className="glass-strong rounded-3xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Welcome Back
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 glass rounded-xl border border-white/20 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 glass rounded-xl border border-white/20 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 btn-glass text-white rounded-xl font-semibold disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600 dark:text-gray-300">
          Don't have an account?{' '}
          <Link to="/signup" className="text-purple-600 dark:text-purple-400 font-semibold">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
```

**6. Create Sign Up Page:**

File: `frontend/src/pages/SignUp.jsx`
```jsx
// Similar structure to Login.jsx but with additional fields
// firstName, lastName, confirmPassword
// Call authService.register() instead of login()
```

**7. Create Protected Route:**

File: `frontend/src/components/ProtectedRoute.jsx`
```jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
```

**8. Set Up Router:**

File: `frontend/src/App.jsx`
```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

**Testing:**
```bash
# Start frontend
npm run dev

# Test flow:
1. Visit http://localhost:3000
2. Should redirect to /login
3. Click "Sign up"
4. Create account
5. Should redirect to /dashboard
6. Refresh page - should stay logged in
7. Open DevTools > Application > Local Storage
8. Verify tokens stored
```

**Verification Checklist:**
- [ ] Login page renders
- [ ] Sign up page renders
- [ ] Can create new account
- [ ] Can log in
- [ ] Tokens stored in localStorage
- [ ] Protected routes work
- [ ] Token refresh works (test by waiting 15+ min)
- [ ] Logout clears tokens

**Documentation:** See `04_UI_UX_WIREFRAMES.md` section 4.2

---

## PHASE 2: RESUME MANAGEMENT (Week 3-4)

### Feature 2.1: Resume Model & CRUD Backend
**Priority:** HIGH  
**Estimated Time:** 3-4 hours  
**Dependencies:** Feature 1.1 (Database), Feature 1.2 (Auth)

**Requirements:**
- [ ] Create resume endpoints
- [ ] List user's resumes
- [ ] Get single resume
- [ ] Update resume
- [ ] Delete resume (soft delete)

**Implementation Steps:**

**1. Create Resume Service:**

File: `backend/src/services/resume.service.ts`
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ResumeService {
  async createResume(userId: string, title: string, content: any, templateId?: string) {
    const resume = await prisma.resume.create({
      data: {
        userId,
        title,
        content,
        templateId,
        status: 'draft',
      },
    });

    // Increment user's resume count
    await prisma.user.update({
      where: { id: userId },
      data: { resumesCreated: { increment: 1 } },
    });

    return resume;
  }

  async getResumes(userId: string, page = 1, limit = 10, status?: string) {
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    const [resumes, total] = await Promise.all([
      prisma.resume.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          template: {
            select: { id: true, name: true, category: true },
          },
        },
      }),
      prisma.resume.count({ where }),
    ]);

    return {
      resumes,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getResumeById(resumeId: string, userId: string) {
    const resume = await prisma.resume.findFirst({
      where: {
        id: resumeId,
        userId,
        deletedAt: null,
      },
      include: {
        template: true,
      },
    });

    if (!resume) {
      throw new Error('Resume not found');
    }

    // Update last accessed
    await prisma.resume.update({
      where: { id: resumeId },
      data: { lastAccessedAt: new Date() },
    });

    return resume;
  }

  async updateResume(resumeId: string, userId: string, data: any) {
    // Verify ownership
    const existing = await prisma.resume.findFirst({
      where: { id: resumeId, userId, deletedAt: null },
    });

    if (!existing) {
      throw new Error('Resume not found');
    }

    // Create version before updating
    await prisma.resumeVersion.create({
      data: {
        resumeId,
        versionNumber: existing.version,
        content: existing.content,
        changeSummary: 'Manual edit',
        changeType: 'manual',
      },
    });

    // Update resume
    const updated = await prisma.resume.update({
      where: { id: resumeId },
      data: {
        ...data,
        version: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    return updated;
  }

  async deleteResume(resumeId: string, userId: string) {
    const existing = await prisma.resume.findFirst({
      where: { id: resumeId, userId, deletedAt: null },
    });

    if (!existing) {
      throw new Error('Resume not found');
    }

    await prisma.resume.update({
      where: { id: resumeId },
      data: { deletedAt: new Date() },
    });
  }
}
```

**2. Create Resume Routes:**

File: `backend/src/routes/resume.routes.ts`
```typescript
import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { ResumeService } from '../services/resume.service';

const router = Router();
const resumeService = new ResumeService();

// All routes require authentication
router.use(authMiddleware);

// GET /api/resumes
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { page, limit, status } = req.query;
    const result = await resumeService.getResumes(
      req.userId!,
      Number(page) || 1,
      Number(limit) || 10,
      status as string
    );

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/resumes
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { title, content, templateId } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content required' });
    }

    const resume = await resumeService.createResume(
      req.userId!,
      title,
      content,
      templateId
    );

    res.status(201).json({ success: true, data: { resume } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/resumes/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const resume = await resumeService.getResumeById(req.params.id, req.userId!);
    res.json({ success: true, data: { resume } });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// PATCH /api/resumes/:id
router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const resume = await resumeService.updateResume(
      req.params.id,
      req.userId!,
      req.body
    );
    res.json({ success: true, data: { resume } });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// DELETE /api/resumes/:id
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await resumeService.deleteResume(req.params.id, req.userId!);
    res.status(204).send();
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

export default router;
```

**3. Update Main Server:**

File: `backend/src/index.ts`
```typescript
import resumeRoutes from './routes/resume.routes';

// Add after auth routes
app.use('/api/resumes', resumeRoutes);
```

**Testing:**
```bash
# Get auth token first
TOKEN="your-jwt-token"

# Create resume
curl -X POST http://localhost:3001/api/resumes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Software Engineer Resume","content":{"personalInfo":{"name":"John Doe"}}}'

# List resumes
curl http://localhost:3001/api/resumes \
  -H "Authorization: Bearer $TOKEN"

# Get single resume
curl http://localhost:3001/api/resumes/{resume-id} \
  -H "Authorization: Bearer $TOKEN"
```

**Verification Checklist:**
- [ ] Can create resume
- [ ] Can list resumes
- [ ] Can get single resume
- [ ] Can update resume
- [ ] Can delete resume
- [ ] Version created on update
- [ ] Authorization works (can't access other user's resumes)

**Documentation:** See `03_API_ENDPOINTS.md` section 5.3

---

### Feature 2.2: Dashboard Frontend
**Priority:** HIGH  
**Estimated Time:** 4-5 hours  
**Dependencies:** Feature 1.3 (Auth Frontend), Feature 2.1 (Resume Backend)

**Requirements:**
- [ ] Dashboard layout
- [ ] Stats cards (resume count, etc.)
- [ ] Recent resumes list
- [ ] Create resume button
- [ ] Navigation

**Implementation Steps:**

File: `frontend/src/pages/Dashboard.jsx`
```jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../services/api';
import useAuthStore from '../stores/authStore';

const Dashboard = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const response = await apiClient.get('/api/resumes');
      setResumes(response.data.data.resumes);
    } catch (error) {
      console.error('Failed to fetch resumes:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen animated-bg paper-texture">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Welcome back, {user?.firstName || 'there'}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Let's build an amazing resume today
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-strong rounded-3xl p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-800 dark:text-white">
                  {resumes.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Resumes</div>
              </div>
            </div>
          </div>

          <div className="glass-strong rounded-3xl p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-800 dark:text-white">
                  {user?.analysesRunToday || 0}/5
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Analyses Today</div>
              </div>
            </div>
          </div>

          <div className="glass-strong rounded-3xl p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-3 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-800 dark:text-white">
                  {user?.aiGenerationsToday || 0}/20
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">AI Uses Today</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="glass-strong rounded-3xl p-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/resume/new"
                className="glass p-4 rounded-2xl hover:scale-105 transition-transform flex items-center space-x-3"
              >
                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Create New Resume
                </span>
              </Link>

              <Link
                to="/upload"
                className="glass p-4 rounded-2xl hover:scale-105 transition-transform flex items-center space-x-3"
              >
                <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Upload Resume
                </span>
              </Link>

              <Link
                to="/analyze"
                className="glass p-4 rounded-2xl hover:scale-105 transition-transform flex items-center space-x-3"
              >
                <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Analyze Resume
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Resumes */}
        <div className="glass-strong rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              Recent Resumes
            </h2>
            <Link to="/resumes" className="text-purple-600 dark:text-purple-400 hover:underline">
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-300">
              Loading...
            </div>
          ) : resumes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📄</div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                No resumes yet
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Create your first resume to get started!
              </p>
              <Link
                to="/resume/new"
                className="inline-block px-6 py-3 btn-glass text-white rounded-xl font-semibold"
              >
                Create Resume
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {resumes.slice(0, 5).map((resume) => (
                <div
                  key={resume.id}
                  className="glass rounded-2xl p-4 hover:scale-[1.02] transition-transform"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 dark:text-white mb-1">
                        {resume.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Updated {new Date(resume.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/resume/${resume.id}/edit`}
                        className="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg font-medium hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                      >
                        Edit
                      </Link>
                      <Link
                        to={`/resume/${resume.id}/analyze`}
                        className="px-4 py-2 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 rounded-lg font-medium hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                      >
                        Analyze
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
```

**Verification Checklist:**
- [ ] Dashboard renders
- [ ] Stats cards show correct data
- [ ] Recent resumes list populated
- [ ] Quick actions work
- [ ] Empty state shows when no resumes
- [ ] Loading state works

**Documentation:** See `04_UI_UX_WIREFRAMES.md` section 4.3

---

## PHASE 3: AI FEATURES (Week 5-6)

### Feature 3.1: Multi-AI Provider Setup
**Priority:** CRITICAL  
**Estimated Time:** 3-4 hours  
**Dependencies:** Feature 1.1 (Database)

**Requirements:**
- [ ] AI provider abstraction layer
- [ ] OpenAI integration
- [ ] Gemini integration
- [ ] Provider selection logic
- [ ] Response caching (Redis)
- [ ] Usage tracking

**Implementation:**

File: `backend/src/services/ai/AIProvider.interface.ts`
```typescript
export interface AnalysisResult {
  overallScore: number;
  keywordAnalysis: {
    foundKeywords: string[];
    missingKeywords: string[];
  };
  experienceRelevance: {
    summary: string;
    details: Array<{
      jdRequirement: string;
      resumeEvidence: string;
      matchStrength: 'Strong' | 'Partial' | 'Weak';
    }>;
  };
  atsFormattingScore: {
    score: number;
    feedback: string;
  };
  actionableAdvice: string[];
}

export interface AIProvider {
  name: string;
  analyze(resumeText: string, jobDescription: string): Promise<AnalysisResult>;
  generateBullets(context: any): Promise<string[]>;
  optimizeContent(content: string, jobDescription: string): Promise<string>;
}
```

File: `backend/src/services/ai/OpenAIProvider.ts`
```typescript
import OpenAI from 'openai';
import { AIProvider, AnalysisResult } from './AIProvider.interface';

export class OpenAIProvider implements AIProvider {
  name = 'openai';
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async analyze(resumeText: string, jobDescription: string): Promise<AnalysisResult> {
    const systemPrompt = `You are an expert ATS analyzer...`; // Copy from current code
    
    const completion = await this.client.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Resume: ${resumeText}\n\nJob Description: ${jobDescription}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    return JSON.parse(completion.choices[0].message.content!);
  }

  async generateBullets(context: any): Promise<string[]> {
    // Implementation
    return [];
  }

  async optimizeContent(content: string, jobDescription: string): Promise<string> {
    // Implementation
    return '';
  }
}
```

File: `backend/src/services/ai/GeminiProvider.ts`
```typescript
// Similar to OpenAIProvider but using Gemini SDK
```

File: `backend/src/services/ai/AIService.ts`
```typescript
import { AIProvider } from './AIProvider.interface';
import { OpenAIProvider } from './OpenAIProvider';
import { GeminiProvider } from './GeminiProvider';

export class AIService {
  private providers: Map<string, AIProvider>;

  constructor() {
    this.providers = new Map();
    this.providers.set('openai', new OpenAIProvider());
    this.providers.set('gemini', new GeminiProvider());
  }

  selectProvider(userTier: string): AIProvider {
    if (userTier === 'free') {
      return this.providers.get('gemini')!;
    }
    return this.providers.get('openai')!;
  }

  async analyze(resumeText: string, jobDescription: string, userTier: string) {
    const provider = this.selectProvider(userTier);
    return await provider.analyze(resumeText, jobDescription);
  }
}
```

**Verification Checklist:**
- [ ] OpenAI provider works
- [ ] Gemini provider works
- [ ] Provider selection logic works
- [ ] Free tier uses Gemini
- [ ] Premium uses OpenAI

---

### Feature 3.2: Resume Analysis Integration
**Priority:** CRITICAL  
**Estimated Time:** 4-5 hours  
**Dependencies:** Feature 3.1 (AI Setup), Feature 2.1 (Resume Backend)

**Requirements:**
- [ ] Analysis endpoint using new AI service
- [ ] Analysis model in database
- [ ] Usage tracking
- [ ] Rate limiting by tier

**Implementation:**

File: `backend/src/services/analysis.service.ts`
```typescript
import { PrismaClient } from '@prisma/client';
import { AIService } from './ai/AIService';

const prisma = new PrismaClient();
const aiService = new AIService();

export class AnalysisService {
  async createAnalysis(userId: string, resumeId: string, jobDescription: string) {
    // Get user for tier info
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    // Check daily limit
    if (user.analysesRunToday >= 5 && user.subscriptionTier === 'free') {
      throw new Error('Daily analysis limit reached');
    }

    // Get resume
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId },
    });
    if (!resume) throw new Error('Resume not found');

    // Create pending analysis
    const analysis = await prisma.analysis.create({
      data: {
        userId,
        resumeId,
        analysisType: 'full_analysis',
        status: 'processing',
      },
    });

    // Run analysis
    try {
      const result = await aiService.analyze(
        resume.extractedText || '',
        jobDescription,
        user.subscriptionTier
      );

      // Update analysis with results
      const completed = await prisma.analysis.update({
        where: { id: analysis.id },
        data: {
          results: result,
          status: 'completed',
          completedAt: new Date(),
        },
      });

      // Update user's daily count
      await prisma.user.update({
        where: { id: userId },
        data: {
          analysesRunToday: { increment: 1 },
          lastAnalysisDate: new Date(),
        },
      });

      return completed;
    } catch (error) {
      // Mark as failed
      await prisma.analysis.update({
        where: { id: analysis.id },
        data: {
          status: 'failed',
          errorMessage: error.message,
        },
      });
      throw error;
    }
  }
}
```

**Verification Checklist:**
- [ ] Analysis endpoint works
- [ ] Results saved to database
- [ ] Usage tracking increments
- [ ] Rate limiting enforced

---

## CURRENT PROGRESS TRACKER

### Update this section as you complete features:

**🎉 PHASE 1: FOUNDATION - COMPLETE!**
- ✅ Database schema with 9 models (User, Resume, Analysis, etc.)
- ✅ Authentication backend (JWT, bcrypt, validation)
- ✅ Authentication frontend (React Router, Zustand, forms)
- ✅ Full user registration/login flow with token refresh
- ✅ Protected routes and auth state management

```
PHASE 1: FOUNDATION
├─ [✅] Feature 1.1: Database Setup
├─ [✅] Feature 1.2: Authentication Backend  
├─ [✅] Feature 1.3: Authentication Frontend (Dashboard integrated with ATS Analysis)
└─ Status: COMPLETE

PHASE 2: RESUME MANAGEMENT
├─ [✅] Feature 2.1: Resume Model & CRUD Backend
├─ [⬜] Feature 2.2: Dashboard Frontend
├─ [⬜] Feature 2.3: Resume Builder (TODO: Not documented yet)
├─ [⬜] Feature 2.4: Template System (TODO: Not documented yet)
└─ Status: IN PROGRESS

PHASE 3: AI FEATURES
├─ [⬜] Feature 3.1: Multi-AI Provider Setup
├─ [⬜] Feature 3.2: Resume Analysis Integration
├─ [⬜] Feature 3.3: AI Content Generation (TODO: Not documented yet)
├─ [⬜] Feature 3.4: AI Content Optimization (TODO: Not documented yet)
└─ Status: NOT STARTED

PHASE 4: POLISH & EXPORT
├─ [⬜] Feature 4.1: PDF Export (TODO: Not documented yet)
├─ [⬜] Feature 4.2: DOCX Export (TODO: Not documented yet)
├─ [⬜] Feature 4.3: Performance Optimization (TODO: Not documented yet)
├─ [⬜] Feature 4.4: Deployment (TODO: Not documented yet)
└─ Status: NOT STARTED
```

---

## NEXT STEPS FOR AI AGENT

**Immediate Action:**
1. Review current state above
2. Start with first unchecked feature
3. Follow implementation steps exactly
4. Test thoroughly
5. Mark checkbox when done
6. Update current state
7. Move to next feature

**Before Starting Any Feature:**
- [ ] Read feature requirements
- [ ] Check dependencies completed
- [ ] Review relevant documentation
- [ ] Understand testing criteria

**After Completing Each Feature:**
- [ ] Run tests
- [ ] Manual verification
- [ ] Mark checkbox
- [ ] Update progress tracker
- [ ] Commit changes to Git

---

## 📚 Documentation Quick Links

- **Architecture:** `/ATS_PROJECT_DOCS/01_TECHNICAL_ARCHITECTURE.md`
- **Database:** `/ATS_PROJECT_DOCS/02_DATABASE_SCHEMA.md`
- **API Specs:** `/ATS_PROJECT_DOCS/03_API_ENDPOINTS.md`
- **UI Design:** `/ATS_PROJECT_DOCS/04_UI_UX_WIREFRAMES.md`
- **Roadmap:** `/ATS_PROJECT_DOCS/05_IMPLEMENTATION_ROADMAP.md`

---

## 🔄 Daily Workflow

**Start of Day:**
1. Review current progress
2. Read next feature requirements
3. Check documentation
4. Plan implementation

**During Development:**
1. Follow implementation steps
2. Test as you go
3. Commit frequently
4. Ask for clarification if needed

**End of Day:**
1. Complete testing
2. Update progress tracker
3. Mark completed checkboxes
4. Plan tomorrow's work

---

**Remember:** Build one feature at a time, test thoroughly, and keep documentation updated!

**Document Version:** 1.0  
**Last Updated:** October 8, 2025  
**Status:** Ready for AI Agent Implementation
