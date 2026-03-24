/**
 * Per-User Rate Limiter
 * 
 * Tracks usage for individual users based on subscription tier.
 * Supports different limits for different endpoints/features.
 * 
 * Uses in-memory storage for simplicity (suitable for single-instance deployments).
 * For distributed systems, consider using Redis instead.
 */

import { getRateLimitConfig, type SubscriptionTier } from '../config/rate-limits.config';

export type RateLimitKey = 'analyses_daily' | 'resumes_monthly' | 'job_descriptions_monthly';

interface UsageRecord {
  count: number;
  resetAt: number;
}

interface UserUsageTracker {
  [key: string]: UsageRecord;
}

class RateLimiter {
  private userTrackers = new Map<string, UserUsageTracker>();
  private cleanupInterval = 60 * 60 * 1000; // 1 hour
  private lastCleanup = Date.now();

  constructor() {
    // Periodic cleanup of expired entries
    setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  /**
   * Check if user has exceeded rate limit for a specific key
   * Returns { allowed: boolean, remaining: number, resetAt: number }
   */
  checkLimit(userId: string, limitKey: RateLimitKey, subscriptionTier: string): {
    allowed: boolean;
    current: number;
    limit: number;
    remaining: number;
    resetAt: number;
  } {
    const now = Date.now();
    const config = getRateLimitConfig(subscriptionTier);

    // Determine the limit and reset window based on the key
    let limit: number;
    let resetWindowMs: number;

    switch (limitKey) {
      case 'analyses_daily':
        limit = config.analysesPerDay;
        resetWindowMs = 24 * 60 * 60 * 1000; // 24 hours
        break;
      case 'resumes_monthly':
        limit = config.resumeUploadsPerMonth;
        resetWindowMs = 30 * 24 * 60 * 60 * 1000; // 30 days
        break;
      case 'job_descriptions_monthly':
        limit = config.jobDescriptionsPerMonth;
        resetWindowMs = 30 * 24 * 60 * 60 * 1000; // 30 days
        break;
      default:
        throw new Error(`Unknown rate limit key: ${limitKey}`);
    }

    // Get or create user tracker
    let userTracker = this.userTrackers.get(userId);
    if (!userTracker) {
      userTracker = {};
      this.userTrackers.set(userId, userTracker);
    }

    // Get or create usage record for this key
    let usage = userTracker[limitKey];
    if (!usage || usage.resetAt <= now) {
      usage = {
        count: 0,
        resetAt: now + resetWindowMs,
      };
      userTracker[limitKey] = usage;
    }

    // Check if limit exceeded
    const allowed = usage.count < limit;

    return {
      allowed,
      current: usage.count,
      limit,
      remaining: Math.max(0, limit - usage.count),
      resetAt: usage.resetAt,
    };
  }

  /**
   * Increment usage counter for a specific key
   */
  incrementUsage(userId: string, limitKey: RateLimitKey): void {
    const userTracker = this.userTrackers.get(userId);
    if (!userTracker || !userTracker[limitKey]) {
      return;
    }

    userTracker[limitKey].count += 1;
  }

  /**
   * Get current usage without incrementing
   */
  getUsage(userId: string, limitKey: RateLimitKey): { current: number; resetAt: number } | null {
    const userTracker = this.userTrackers.get(userId);
    if (!userTracker || !userTracker[limitKey]) {
      return null;
    }

    const usage = userTracker[limitKey];
    const now = Date.now();

    // If window has expired, return null
    if (usage.resetAt <= now) {
      return null;
    }

    return {
      current: usage.count,
      resetAt: usage.resetAt,
    };
  }

  /**
   * Reset usage for a specific user and key (admin function)
   */
  resetUsage(userId: string, limitKey?: RateLimitKey): void {
    if (!limitKey) {
      // Reset all keys for user
      this.userTrackers.delete(userId);
    } else {
      const userTracker = this.userTrackers.get(userId);
      if (userTracker) {
        delete userTracker[limitKey];
      }
    }
  }

  /**
   * Clean up expired entries from memory
   */
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [userId, userTracker] of this.userTrackers) {
      for (const [key, usage] of Object.entries(userTracker)) {
        if (usage.resetAt <= now) {
          delete userTracker[key];
          cleanedCount++;
        }
      }

      // Remove user tracker if empty
      if (Object.keys(userTracker).length === 0) {
        this.userTrackers.delete(userId);
      }
    }

    this.lastCleanup = now;
    if (cleanedCount > 0) {
      console.log(`[RateLimiter] Cleaned up ${cleanedCount} expired entries`);
    }
  }

  /**
   * Get statistics about current memory usage (for monitoring)
   */
  getStats(): {
    totalUsers: number;
    totalTrackers: number;
  } {
    let totalTrackers = 0;
    for (const userTracker of this.userTrackers.values()) {
      totalTrackers += Object.keys(userTracker).length;
    }

    return {
      totalUsers: this.userTrackers.size,
      totalTrackers,
    };
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Helper function to format reset time for response headers
 */
export function formatResetTime(resetAtMs: number): string {
  const secondsUntilReset = Math.ceil((resetAtMs - Date.now()) / 1000);
  return Math.max(0, secondsUntilReset).toString();
}
