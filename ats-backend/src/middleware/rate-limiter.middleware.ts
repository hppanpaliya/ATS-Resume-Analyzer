/**
 * Rate Limiter Middleware
 * 
 * Enforces per-user rate limits based on subscription tier.
 * Applies different limits to different endpoints.
 * 
 * Returns 429 (Too Many Requests) when limits are exceeded.
 * Includes rate limit headers for client information.
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import prisma from '../lib/prisma';
import { rateLimiter, formatResetTime, type RateLimitKey } from '../utils/rate-limiter';
import { Logger } from '../utils/logger';

/**
 * Create a rate limit middleware for a specific endpoint/feature
 */
export function createRateLimitMiddleware(limitKey: RateLimitKey) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Skip rate limiting if no user (public endpoint) or admin override
      if (!req.userId) {
        return next();
      }

      // Get user from database to fetch subscription tier
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: {
          id: true,
          subscriptionTier: true,
          deletedAt: true,
        },
      });

      if (!user || user.deletedAt) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Check rate limit
      const limitStatus = rateLimiter.checkLimit(
        req.userId,
        limitKey,
        user.subscriptionTier
      );

      // Add rate limit headers to response
      res.setHeader('X-RateLimit-Limit', limitStatus.limit);
      res.setHeader('X-RateLimit-Remaining', limitStatus.remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil(limitStatus.resetAt / 1000)); // Unix timestamp

      // If limit exceeded, return 429
      if (!limitStatus.allowed) {
        const retryAfter = formatResetTime(limitStatus.resetAt);
        res.setHeader('Retry-After', retryAfter);

        Logger.warn(
          `Rate limit exceeded for user ${req.userId} (${limitKey}): ` +
          `${limitStatus.current}/${limitStatus.limit}`
        );

        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          details: {
            limit: limitStatus.limit,
            current: limitStatus.current,
            remaining: limitStatus.remaining,
            resetAt: new Date(limitStatus.resetAt).toISOString(),
            retryAfterSeconds: parseInt(retryAfter, 10),
          },
        });
      }

      // Increment usage counter
      rateLimiter.incrementUsage(req.userId, limitKey);

      Logger.debug(
        `Rate limit check passed for user ${req.userId} (${limitKey}): ` +
        `${limitStatus.current + 1}/${limitStatus.limit}`
      );

      next();
    } catch (error) {
      Logger.error('Rate limiter middleware error:', error instanceof Error ? error : new Error(String(error)));
      // Don't block request on middleware error, just log
      next();
    }
  };
}

/**
 * Middleware for daily analyses limit
 */
export const analysesPerDayLimiter = createRateLimitMiddleware('analyses_daily');

/**
 * Middleware for monthly resume uploads limit
 */
export const resumeUploadsPerMonthLimiter = createRateLimitMiddleware('resumes_monthly');

/**
 * Middleware for monthly job descriptions limit
 */
export const jobDescriptionsPerMonthLimiter = createRateLimitMiddleware(
  'job_descriptions_monthly'
);
