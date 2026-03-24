import { Router, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { AuthService } from '../services/auth.service';
import { AuthRequest, authMiddleware } from '../middleware/auth.middleware';
import { sanitizeEmail, sanitizeString } from '../utils/sanitizer';
import prisma from '../lib/prisma';
import { AppError } from '../utils/errors';
import { Logger } from '../utils/logger';

const router: Router = Router();
const authService = new AuthService();

const authServiceUnavailable = 'Authentication service is temporarily unavailable. Please verify database setup and try again.';
const authErrorStatuses: Record<string, number> = {
  'User already exists': 409,
  'Invalid credentials': 401,
  'Invalid refresh token': 401,
};

const isPrismaInfrastructureError = (error: unknown) => (
  error instanceof Prisma.PrismaClientInitializationError ||
  error instanceof Prisma.PrismaClientRustPanicError ||
  (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    ['P1001', 'P1008', 'P2021', 'P2022'].includes(error.code)
  )
);

const sendAuthError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  if (error instanceof Error && authErrorStatuses[error.message]) {
    return res.status(authErrorStatuses[error.message]).json({ error: error.message });
  }

  if (isPrismaInfrastructureError(error)) {
    Logger.error(`${fallbackMessage}: infrastructure failure`, error instanceof Error ? error : undefined);
    return res.status(503).json({ error: authServiceUnavailable });
  }

  Logger.error(fallbackMessage, error instanceof Error ? error : undefined);
  return res.status(500).json({ error: fallbackMessage });
};

router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').optional().isLength({ min: 1, max: 100 }),
  body('lastName').optional().isLength({ min: 1, max: 100 }),
], async (req: Request, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid input', details: errors.array() });
    }

    const email = sanitizeEmail(req.body.email);
    const password = req.body.password; // Don't sanitize passwords
    const firstName = sanitizeString(req.body.firstName);
    const lastName = sanitizeString(req.body.lastName);

    const result = await authService.register(email, password, firstName || undefined, lastName || undefined);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          subscriptionTier: result.user.subscriptionTier,
          emailVerified: result.user.emailVerified,
        },
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      },
    });
  } catch (error: any) {
    return sendAuthError(res, error, 'Registration failed. Please try again later.');
  }
});

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 1 }),
], async (req: Request, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid input', details: errors.array() });
    }

    const email = sanitizeEmail(req.body.email);
    const password = req.body.password; // Don't sanitize passwords

    const result = await authService.login(email, password);

    res.json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          subscriptionTier: result.user.subscriptionTier,
          emailVerified: result.user.emailVerified,
        },
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      },
    });
  } catch (error: any) {
    return sendAuthError(res, error, 'Login failed. Please try again later.');
  }
});

router.post('/refresh', [
  body('refreshToken').isLength({ min: 1 }),
], async (req: Request, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid input', details: errors.array() });
    }

    const { refreshToken } = req.body;

    const result = await authService.refreshToken(refreshToken);

    res.json({
      success: true,
      data: {
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      },
    });
  } catch (error: any) {
    return sendAuthError(res, error, 'Refresh failed. Please try again later.');
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        subscriptionTier: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error: any) {
    return sendAuthError(res, error, 'Internal server error');
  }
});

router.post('/logout', [
  body('refreshToken').optional().isLength({ min: 1 }),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid input', details: errors.array() });
    }

    const { refreshToken } = req.body;
    if (typeof refreshToken === 'string' && refreshToken.length > 0) {
      await authService.revokeRefreshSession(refreshToken);
    }

    res.json({ success: true, message: 'Logged out' });
  } catch (_error: any) {
    return sendAuthError(res, _error, 'Logout failed');
  }
});

export default router;
