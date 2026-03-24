/**
 * Health Check Routes
 * Provides service health status endpoints
 */

import { Router, Request, Response } from 'express';
import { AIService } from '../services/ai.service';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';
import type { ApiResponse, HealthCheckResponse } from '../types/index';

const router: Router = Router();
const aiService = new AIService();

/**
 * Admin authorization helper
 */
const requireAdmin = async (req: AuthRequest, res: Response) => {
  if (!req.userId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { subscriptionTier: true },
  });

  if (!user || user.subscriptionTier !== 'admin') {
    res.status(403).json({ success: false, error: 'Admin access required' });
    return null;
  }

  return user;
};

/**
 * Standard error response helper
 */
const serverError = (res: Response, error: string) => {
  res.status(500).json({
    success: false,
    error,
  });
};

/**
 * GET /health - Local health check
 * Simple health check endpoint (no authentication required)
 * Returns status of API service
 */
router.get('/health', async (_req: Request, res: Response) => {
    try {
        const response: ApiResponse<{ status: string; service: string }> = {
            success: true,
            data: {
                status: 'healthy',
                service: 'ATS Resume Analyzer API'
            }
        };
        res.json(response);
    } catch (_error: unknown) {
        serverError(res, 'Health check failed');
    }
});

/**
 * GET /health/upstream - Protected upstream dependency check
 * Checks health of external dependencies (AI service, database, etc.)
 * Admin only endpoint
 */
router.get('/health/upstream', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const adminUser = await requireAdmin(req, res);
        if (!adminUser) {
            return;
        }

        const health = await aiService.checkHealth();
        const response: ApiResponse<HealthCheckResponse> = {
            success: true,
            data: health
        };
        res.json(response);
    } catch (_error: unknown) {
        serverError(res, 'Health check failed');
    }
});

export default router;
