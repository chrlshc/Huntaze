/**
 * AI Quota Management System
 * 
 * Handles quota checking, enforcement, and notifications
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { getCurrentMonthSpending, getQuotaLimit } from './billing';

export type CreatorPlan = 'starter' | 'pro' | 'business';

/**
 * Quota error thrown when monthly limit is exceeded
 */
export class QuotaExceededError extends Error {
  code = 'QUOTA_EXCEEDED';
  details: {
    currentUsage: number;
    limit: number;
    plan: CreatorPlan;
    estimatedCost: number;
  };

  constructor(
    currentUsage: number,
    limit: number,
    plan: CreatorPlan,
    estimatedCost: number
  ) {
    super(
      `Monthly quota exceeded. Current: $${currentUsage.toFixed(2)}, ` +
      `Limit: $${limit.toFixed(2)}, Plan: ${plan}`
    );
    this.details = {
      currentUsage,
      limit,
      plan,
      estimatedCost,
    };
  }
}

/**
 * Assert that a creator is within their monthly quota
 * Requirement 4.1: Check quota before execution
 * Requirement 4.2: Reject when quota exceeded
 * Requirement 4.5: Handle plan upgrades with immediate quota updates
 * 
 * @throws {QuotaExceededError} When quota would be exceeded
 */
export async function assertWithinMonthlyQuota(
  creatorId: number,
  plan: CreatorPlan,
  estimatedCostUsd: number
): Promise<void> {
  const currentSpending = await getCurrentMonthSpending(creatorId);
  const limit = getQuotaLimit(plan);
  const projectedSpending = currentSpending + estimatedCostUsd;

  // Requirement 4.2: Reject if quota would be exceeded
  if (projectedSpending > limit) {
    throw new QuotaExceededError(currentSpending, limit, plan, estimatedCostUsd);
  }

  // Requirement 4.3: Check for threshold notifications
  await checkQuotaThresholds(creatorId, plan, currentSpending, projectedSpending);
}

/**
 * Quota threshold percentages for notifications
 * Requirement 4.3: Notify at 80% and 95%
 */
const QUOTA_THRESHOLDS = [0.8, 0.95];

/**
 * Check if quota thresholds are crossed and create notifications
 * Requirement 4.3: Add quota threshold notifications (80%, 95%)
 */
async function checkQuotaThresholds(
  creatorId: number,
  plan: CreatorPlan,
  currentSpending: number,
  projectedSpending: number
): Promise<void> {
  const limit = getQuotaLimit(plan);
  
  // Skip for business plan (unlimited)
  if (plan === 'business') {
    return;
  }

  for (const threshold of QUOTA_THRESHOLDS) {
    const thresholdAmount = limit * threshold;
    
    // Check if we're crossing this threshold with this request
    if (currentSpending < thresholdAmount && projectedSpending >= thresholdAmount) {
      await createQuotaThresholdNotification(
        creatorId,
        threshold,
        projectedSpending,
        limit
      );
    }
  }
}

/**
 * Create a quota threshold notification
 * Requirement 4.3: Notify users when approaching quota limits
 */
async function createQuotaThresholdNotification(
  creatorId: number,
  threshold: number,
  currentSpending: number,
  limit: number
): Promise<void> {
  const percentUsed = threshold * 100;
  
  // Log the notification (placeholder for actual notification system)
  console.warn(
    `[QUOTA THRESHOLD] Creator ${creatorId} has reached ${percentUsed}% of quota. ` +
    `Spending: $${currentSpending.toFixed(2)} / $${limit.toFixed(2)}`
  );
  
  // TODO: Integrate with actual notification system
  // This could be:
  // - Email notification
  // - In-app notification
  // - Webhook to external system
  // - Database record for notification center
  
  // Example integration point:
  // await notificationService.create({
  //   creatorId,
  //   type: 'quota_threshold',
  //   priority: threshold >= 0.95 ? 'high' : 'medium',
  //   title: `AI Quota Alert: ${percentUsed}% Used`,
  //   message: `You've used ${percentUsed}% of your monthly AI quota ($${currentSpending.toFixed(2)} of $${limit.toFixed(2)})`,
  //   data: { currentSpending, limit, threshold, percentUsed }
  // });
}

/**
 * Get remaining quota information for a creator
 * Requirement 4.1: Allow checking quota status
 */
export async function getRemainingQuota(
  creatorId: number,
  plan: CreatorPlan
): Promise<{
  limit: number;
  spent: number;
  remaining: number;
  percentUsed: number;
}> {
  const spent = await getCurrentMonthSpending(creatorId);
  const limit = getQuotaLimit(plan);
  const remaining = Math.max(0, limit - spent);
  const percentUsed = limit > 0 ? (spent / limit) * 100 : 0;

  return {
    limit,
    spent,
    remaining,
    percentUsed,
  };
}

/**
 * Check if a creator can make a request without exceeding quota
 * Requirement 4.1: Check quota before execution
 */
export async function canMakeRequest(
  creatorId: number,
  plan: CreatorPlan,
  estimatedCostUsd: number
): Promise<boolean> {
  try {
    await assertWithinMonthlyQuota(creatorId, plan, estimatedCostUsd);
    return true;
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      return false;
    }
    throw error;
  }
}
