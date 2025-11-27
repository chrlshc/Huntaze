// AI Billing - Monthly aggregation and quota management
import { db as prisma } from '../prisma';

export async function recomputeMonthlyChargesForMonth(month: Date) {
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);

  const grouped = await prisma.usageLog.groupBy({
    by: ['creatorId'],
    where: {
      createdAt: {
        gte: monthStart,
        lt: nextMonth,
      },
    },
    _sum: {
      tokensInput: true,
      tokensOutput: true,
      costUsd: true,
    },
  });

  // Fix N+1: Batch all upserts in a single transaction
  // This reduces N queries to 1 transaction with N operations
  await prisma.$transaction(
    grouped.map(row => {
      const planPrice = 29; // Default starter plan

      return prisma.monthlyCharge.upsert({
        where: {
          creatorId_month: {
            creatorId: row.creatorId,
            month: monthStart,
          },
        },
        create: {
          creatorId: row.creatorId,
          month: monthStart,
          totalTokensInput: row._sum.tokensInput ?? 0,
          totalTokensOutput: row._sum.tokensOutput ?? 0,
          totalCostUsd: row._sum.costUsd ?? 0,
          planPrice,
        },
        update: {
          totalTokensInput: row._sum.tokensInput ?? 0,
          totalTokensOutput: row._sum.tokensOutput ?? 0,
          totalCostUsd: row._sum.costUsd ?? 0,
          planPrice,
        },
      });
    })
  );
}

/**
 * Monthly quota limits by plan (Requirement 4.3)
 * Starter: $10/month
 * Pro: $50/month
 * Business: Unlimited
 */
const MONTHLY_QUOTA_USD = {
  starter: 10,
  pro: 50,
  business: 999999, // Effectively unlimited
};

/**
 * Quota threshold percentages for notifications (Requirement 4.3)
 */
const QUOTA_THRESHOLDS = [0.8, 0.95]; // 80% and 95%

/**
 * Get current month's spending for a creator
 * Requirement 4.1: Check quota before execution
 */
export async function getCurrentMonthSpending(creatorId: number): Promise<number> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const spent = await prisma.usageLog.aggregate({
    where: {
      creatorId,
      createdAt: {
        gte: monthStart,
      },
    },
    _sum: {
      costUsd: true,
    },
  });

  return Number(spent._sum.costUsd ?? 0);
}

/**
 * Check if adding a new cost would exceed quota
 * Requirement 4.1: Verify quota before execution
 * Requirement 4.2: Reject when quota exceeded
 */
export async function assertWithinMonthlyQuota(
  creatorId: number,
  plan: 'starter' | 'pro' | 'business',
  estimatedNewCostUsd: number,
) {
  const currentSpending = await getCurrentMonthSpending(creatorId);
  const limit = MONTHLY_QUOTA_USD[plan];
  const projectedSpending = currentSpending + estimatedNewCostUsd;

  // Requirement 4.2: Reject if quota would be exceeded
  if (projectedSpending > limit) {
    const error = new Error(
      `Monthly quota exceeded. Current: $${currentSpending.toFixed(2)}, ` +
      `Limit: $${limit.toFixed(2)}, Plan: ${plan}`
    );
    (error as any).code = 'QUOTA_EXCEEDED';
    (error as any).details = {
      currentUsage: currentSpending,
      limit,
      plan,
      estimatedCost: estimatedNewCostUsd,
    };
    throw error;
  }

  // Requirement 4.3: Check for threshold notifications
  await checkQuotaThresholds(creatorId, plan, currentSpending, projectedSpending);
}

/**
 * Check if quota thresholds are crossed and create notifications
 * Requirement 4.3: Notify at 80% and 95% thresholds
 */
async function checkQuotaThresholds(
  creatorId: number,
  plan: 'starter' | 'pro' | 'business',
  currentSpending: number,
  projectedSpending: number,
) {
  const limit = MONTHLY_QUOTA_USD[plan];
  
  // Skip for business plan (unlimited)
  if (plan === 'business') {
    return;
  }

  for (const threshold of QUOTA_THRESHOLDS) {
    const thresholdAmount = limit * threshold;
    
    // Check if we're crossing this threshold
    if (currentSpending < thresholdAmount && projectedSpending >= thresholdAmount) {
      // Create notification (placeholder - actual notification system TBD)
      console.warn(
        `Quota threshold ${threshold * 100}% reached for creator ${creatorId}. ` +
        `Spending: $${projectedSpending.toFixed(2)} / $${limit.toFixed(2)}`
      );
      
      // TODO: Integrate with notification system when available
      // await createNotification({
      //   creatorId,
      //   type: 'quota_threshold',
      //   message: `You've used ${threshold * 100}% of your monthly AI quota`,
      //   data: { currentSpending: projectedSpending, limit, threshold }
      // });
    }
  }
}

/**
 * Get quota information for a creator
 * Requirement 4.3: Return quota limits by plan
 */
export function getQuotaLimit(plan: 'starter' | 'pro' | 'business'): number {
  return MONTHLY_QUOTA_USD[plan];
}

/**
 * Check remaining quota for a creator
 * Requirement 4.1: Allow checking quota status
 */
export async function getRemainingQuota(
  creatorId: number,
  plan: 'starter' | 'pro' | 'business'
): Promise<{
  limit: number;
  spent: number;
  remaining: number;
  percentUsed: number;
}> {
  const spent = await getCurrentMonthSpending(creatorId);
  const limit = MONTHLY_QUOTA_USD[plan];
  const remaining = Math.max(0, limit - spent);
  const percentUsed = limit > 0 ? (spent / limit) * 100 : 0;

  return {
    limit,
    spent,
    remaining,
    percentUsed,
  };
}
