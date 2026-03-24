/**
 * Rate Limiting Configuration by Subscription Tier
 * 
 * Defines usage limits for different features based on user subscription tier.
 * Used by the rate limiter middleware to enforce per-user limits.
 */

export type SubscriptionTier = 'free' | 'pro' | 'enterprise' | 'admin';

export interface RateLimitConfig {
  analysesPerDay: number;
  resumeUploadsPerMonth: number;
  jobDescriptionsPerMonth: number;
  maxConcurrentAnalyses: number;
  tokenBudgetPerDay?: number; // Optional: for AI token limits
}

/**
 * Rate limit configurations by subscription tier
 * 
 * FREE tier: Entry-level, limited usage for testing
 * PRO tier: Standard plan, suitable for active job seekers
 * ENTERPRISE tier: Unlimited usage for power users
 * ADMIN tier: Internal use, unlimited with monitoring
 */
export const RATE_LIMITS: Record<SubscriptionTier, RateLimitConfig> = {
  free: {
    analysesPerDay: 5,
    resumeUploadsPerMonth: 20,
    jobDescriptionsPerMonth: 20,
    maxConcurrentAnalyses: 1,
    tokenBudgetPerDay: 10000,
  },
  pro: {
    analysesPerDay: 50,
    resumeUploadsPerMonth: 100,
    jobDescriptionsPerMonth: 100,
    maxConcurrentAnalyses: 3,
    tokenBudgetPerDay: 100000,
  },
  enterprise: {
    analysesPerDay: Number.MAX_SAFE_INTEGER,
    resumeUploadsPerMonth: Number.MAX_SAFE_INTEGER,
    jobDescriptionsPerMonth: Number.MAX_SAFE_INTEGER,
    maxConcurrentAnalyses: 10,
    tokenBudgetPerDay: Number.MAX_SAFE_INTEGER,
  },
  admin: {
    analysesPerDay: Number.MAX_SAFE_INTEGER,
    resumeUploadsPerMonth: Number.MAX_SAFE_INTEGER,
    jobDescriptionsPerMonth: Number.MAX_SAFE_INTEGER,
    maxConcurrentAnalyses: Number.MAX_SAFE_INTEGER,
    tokenBudgetPerDay: Number.MAX_SAFE_INTEGER,
  },
};

/**
 * Get rate limit config for a specific tier
 */
export function getRateLimitConfig(tier: string): RateLimitConfig {
  const normalizedTier = (tier?.toLowerCase() || 'free') as SubscriptionTier;
  return RATE_LIMITS[normalizedTier] || RATE_LIMITS.free;
}

/**
 * Check if a tier is valid
 */
export function isValidSubscriptionTier(tier: string): tier is SubscriptionTier {
  return tier in RATE_LIMITS;
}
