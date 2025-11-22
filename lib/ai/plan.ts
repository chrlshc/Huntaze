/**
 * AI Plan Management
 * 
 * Utilities for managing user AI plans and mapping to quota limits
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { db as prisma } from '../prisma';
import { CreatorPlan } from './quota';

/**
 * Get the AI plan for a user
 * 
 * @param userId - User ID
 * @returns AI plan tier (starter, pro, or business)
 */
export async function getUserAIPlan(userId: number): Promise<CreatorPlan> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { ai_plan: true },
  });

  if (!user || !user.ai_plan) {
    return 'starter'; // Default to starter plan
  }

  // Validate and normalize the plan
  const plan = user.ai_plan.toLowerCase();
  if (plan === 'pro' || plan === 'business') {
    return plan as CreatorPlan;
  }

  return 'starter';
}

/**
 * Update the AI plan for a user
 * Requirement 4.5: Handle plan upgrades with immediate quota updates
 * 
 * @param userId - User ID
 * @param plan - New AI plan tier
 */
export async function updateUserAIPlan(
  userId: number,
  plan: CreatorPlan
): Promise<void> {
  await prisma.users.update({
    where: { id: userId },
    data: { ai_plan: plan },
  });
}

/**
 * Map subscription tier to AI plan
 * This allows using existing subscription tiers to determine AI plan
 * 
 * @param subscriptionTier - Subscription tier from subscriptions table
 * @returns Corresponding AI plan
 */
export function mapSubscriptionTierToAIPlan(
  subscriptionTier: string | null | undefined
): CreatorPlan {
  if (!subscriptionTier) {
    return 'starter';
  }

  const tier = subscriptionTier.toLowerCase();
  
  // Map common subscription tier names to AI plans
  if (tier.includes('pro') || tier.includes('premium')) {
    return 'pro';
  }
  
  if (tier.includes('business') || tier.includes('enterprise')) {
    return 'business';
  }
  
  return 'starter';
}

/**
 * Get AI plan from user's active subscription
 * Falls back to ai_plan field if no active subscription
 * 
 * @param userId - User ID
 * @returns AI plan tier
 */
export async function getUserAIPlanFromSubscription(
  userId: number
): Promise<CreatorPlan> {
  // Try to get from active subscription first
  const subscription = await prisma.subscriptions.findFirst({
    where: {
      user_id: userId,
      status: 'active',
    },
    select: { tier: true },
    orderBy: { created_at: 'desc' },
  });

  if (subscription?.tier) {
    return mapSubscriptionTierToAIPlan(subscription.tier);
  }

  // Fall back to ai_plan field
  return getUserAIPlan(userId);
}
