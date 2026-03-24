/**
 * AI Models Routes
 * Handles model listing and cache refresh endpoints
 */

import { Router, Request, Response } from 'express';
import { AIService } from '../services/ai.service';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';
import type { AIModel, ApiResponse } from '../types/index';

const router: Router = Router();
const aiService = new AIService();

/**
 * Admin authorization helper
 * Verifies user has admin privileges
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
 * GET /api/models - Get available AI models
 * Returns cached list of models available through OpenRouter
 * No authentication required
 */
router.get('/models', async (req: Request, res: Response) => {
    try {
        const models = await aiService.getAvailableModels();
        const response: ApiResponse<AIModel[]> = {
            success: true,
            data: models
        };
        res.json(response);
    } catch (_error: unknown) {
        serverError(res, 'Failed to fetch models');
    }
});

/**
 * POST /api/models/refresh - Refresh model cache
 * Forces refresh of the AI models cache from OpenRouter
 * Admin only endpoint
 */
router.post('/models/refresh', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const adminUser = await requireAdmin(req, res);
        if (!adminUser) {
            return;
        }

        const models = await aiService.refreshModelsCache();
        const response: ApiResponse<AIModel[]> = {
            success: true,
            data: models,
            message: 'Model cache refreshed'
        };
        res.json(response);
    } catch (_error: unknown) {
        serverError(res, 'Failed to refresh models');
    }
});

export default router;
