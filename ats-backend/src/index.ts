import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {
  authRoutes,
  resumeRoutes,
  modelsRoutes,
  analysisRoutes,
  jobDescriptionsRoutes,
  healthRoutes,
  templateRoutes,
  adminRoutes,
} from './routes/index';
import { authMiddleware } from './middleware/auth.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { requestContextMiddleware } from './middleware/request-context.middleware';
import {
  analysesPerDayLimiter,
  resumeUploadsPerMonthLimiter,
  jobDescriptionsPerMonthLimiter,
} from './middleware/rate-limiter.middleware';
import { Logger } from './utils/logger';
import { initializeAnalysisJobProcessor } from './jobs/analyze-resume.job';
import { closeQueues } from './config/queue.config';
import path from 'path';

dotenv.config();

const requiredEnvVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);
if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

const app = express();
const PORT = process.env.PORT || 3001;

const defaultCorsOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];
const configuredCorsOrigins = Array.from(new Set([
  ...defaultCorsOrigins,
  ...(process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
    : []),
]));

type HitBucket = {
  count: number;
  resetAt: number;
};

const parsePositiveInt = (rawValue: string | undefined, fallback: number) => {
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
};

const parseBooleanFlag = (rawValue: string | undefined) => {
  if (!rawValue) {
    return false;
  }

  const normalized = rawValue.trim().toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(normalized);
};

const createRateLimiter = (windowMs: number, max: number) => {
  const buckets = new Map<string, HitBucket>();
  let lastCleanup = 0;

  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const now = Date.now();

    if (now - lastCleanup > windowMs) {
      for (const [bucketKey, bucket] of buckets) {
        if (bucket.resetAt <= now) {
          buckets.delete(bucketKey);
        }
      }
      lastCleanup = now;
    }

    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (existing.count >= max) {
      res.setHeader('Retry-After', Math.ceil((existing.resetAt - now) / 1000));
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    existing.count += 1;
    return next();
  };
};

const noopLimiter: express.RequestHandler = (_req, _res, next) => next();

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || configuredCorsOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

const isProduction = process.env.NODE_ENV === 'production';
const disableRateLimits = parseBooleanFlag(process.env.DISABLE_RATE_LIMITS);
const relaxedRateLimits = !isProduction || parseBooleanFlag(process.env.RELAX_RATE_LIMITS);
const rateLimitWindowMs = parsePositiveInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000);

const createConfiguredLimiter = (
  envVarName: string,
  productionMax: number,
  relaxedMax: number
) => {
  if (disableRateLimits) {
    return noopLimiter;
  }

  const fallbackMax = relaxedRateLimits ? relaxedMax : productionMax;
  const max = parsePositiveInt(process.env[envVarName], fallbackMax);
  return createRateLimiter(rateLimitWindowMs, max);
};

const globalLimiter = createConfiguredLimiter('RATE_LIMIT_GLOBAL_MAX', 500, 20000);
const authLimiter = createConfiguredLimiter('RATE_LIMIT_AUTH_MAX', 50, 5000);
const analyzeLimiter = createConfiguredLimiter('RATE_LIMIT_ANALYZE_MAX', 40, 3000);
const adminLimiter = createConfiguredLimiter('RATE_LIMIT_ADMIN_MAX', 10, 5000);

Logger.info('Rate limit configuration loaded', {
  mode: disableRateLimits ? 'disabled' : relaxedRateLimits ? 'relaxed' : 'strict',
  windowMs: rateLimitWindowMs,
  globalMax: parsePositiveInt(process.env.RATE_LIMIT_GLOBAL_MAX, relaxedRateLimits ? 20000 : 500),
  authMax: parsePositiveInt(process.env.RATE_LIMIT_AUTH_MAX, relaxedRateLimits ? 5000 : 50),
  analyzeMax: parsePositiveInt(process.env.RATE_LIMIT_ANALYZE_MAX, relaxedRateLimits ? 3000 : 40),
  adminMax: parsePositiveInt(process.env.RATE_LIMIT_ADMIN_MAX, relaxedRateLimits ? 5000 : 10),
});

app.use((_, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});
// Add request context tracking
app.use(requestContextMiddleware);
app.use(cors(corsOptions));
app.use(globalLimiter);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use('/api/auth', authLimiter);
app.use('/api/analyze', analyzeLimiter);
app.use('/api/models/refresh', adminLimiter);
app.use('/api/templates/seed', adminLimiter);
app.use('/api/admin', adminLimiter);

app.use((err: Error, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  next(err);
});

// Routes
app.use('/api/auth', authRoutes);

// Apply per-user rate limiters within routes after auth where needed
app.use('/api/resumes', resumeRoutes);
app.use('/api/templates', templateRoutes);

// Split AI routes for better modularity
app.use('/api', modelsRoutes); // GET /models, POST /models/refresh
app.use('/api', analysisRoutes); // POST /analyze, GET /analyses, GET /analysis/:jobId/status, GET /queue/stats
app.use('/api', jobDescriptionsRoutes); // GET/POST/PUT/DELETE /job-descriptions
app.use('/api', healthRoutes); // GET /health, GET /health/upstream
app.use('/api/admin', adminRoutes);

// Legacy health check endpoint (kept for backward compatibility)
app.get('/health-legacy', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'ATS Resume Analyzer API',
    version: '1.0.0'
  });
});

// serve react at /

app.use(express.static('build'));

app.get(/^\/(?!api(?:\/|$)|health(?:\/|$)).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../build/index.html"));
});

// 404 handler (must be before error handler)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Initialize job processor and start server
const startServer = async () => {
  try {
    // Initialize analysis job processor
    await initializeAnalysisJobProcessor();
    Logger.info('Analysis job processor initialized');

    const server = app.listen(PORT, () => {
      Logger.info(`Server running on port ${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      Logger.info('SIGTERM received, shutting down gracefully');
      server.close(async () => {
        await closeQueues();
        Logger.info('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      Logger.info('SIGINT received, shutting down gracefully');
      server.close(async () => {
        await closeQueues();
        Logger.info('Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    Logger.error('Failed to start server:', error instanceof Error ? error : new Error(String(error)));
    process.exit(1);
  }
};

startServer();
