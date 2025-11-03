/**
 * Variation Distribution Service
 * Handles A/B test variation assignment and tracking
 */

interface Variation {
  id: string;
  name: string;
  percentage: number;
  content: any;
}

interface DistributionResult {
  variationId: string;
  variationName: string;
  assignedAt: Date;
}

interface VariationAssignment {
  userId: string;
  contentId: string;
  variationId: string;
  assignedAt: Date;
}

/**
 * Assign a user to a variation based on distribution percentages
 */
export function assignVariation(
  userId: string,
  contentId: string,
  variations: Variation[]
): DistributionResult {
  // Validate variations
  if (variations.length === 0) {
    throw new Error('No variations available');
  }

  // Validate percentages sum to 100
  const totalPercentage = variations.reduce((sum, v) => sum + v.percentage, 0);
  if (Math.abs(totalPercentage - 100) > 0.01) {
    throw new Error(`Variation percentages must sum to 100 (current: ${totalPercentage})`);
  }

  // Generate deterministic random number based on userId and contentId
  // This ensures the same user always gets the same variation for the same content
  const hash = hashString(`${userId}-${contentId}`);
  const randomValue = (hash % 10000) / 100; // 0-100

  // Assign variation based on cumulative percentages
  let cumulative = 0;
  for (const variation of variations) {
    cumulative += variation.percentage;
    if (randomValue < cumulative) {
      return {
        variationId: variation.id,
        variationName: variation.name,
        assignedAt: new Date(),
      };
    }
  }

  // Fallback to first variation (should never happen with valid percentages)
  return {
    variationId: variations[0].id,
    variationName: variations[0].name,
    assignedAt: new Date(),
  };
}

/**
 * Simple string hash function for deterministic randomization
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Calculate audience split for variations
 */
export function calculateAudienceSplit(
  variations: Variation[],
  totalAudience: number
): Record<string, number> {
  const split: Record<string, number> = {};

  variations.forEach(variation => {
    split[variation.id] = Math.round((variation.percentage / 100) * totalAudience);
  });

  return split;
}

/**
 * Validate variation distribution setup
 */
export function validateVariationDistribution(variations: Variation[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (variations.length < 2) {
    errors.push('At least 2 variations are required for A/B testing');
  }

  if (variations.length > 5) {
    errors.push('Maximum 5 variations allowed');
  }

  const totalPercentage = variations.reduce((sum, v) => sum + v.percentage, 0);
  if (Math.abs(totalPercentage - 100) > 0.01) {
    errors.push(`Variation percentages must sum to 100% (current: ${totalPercentage}%)`);
  }

  variations.forEach((variation, index) => {
    if (variation.percentage < 0 || variation.percentage > 100) {
      errors.push(`Variation ${index + 1} has invalid percentage: ${variation.percentage}%`);
    }

    if (variation.percentage < 5) {
      errors.push(`Variation ${index + 1} percentage too low (minimum 5%)`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get variation for a specific user (with caching)
 */
export async function getUserVariation(
  userId: string,
  contentId: string,
  variations: Variation[]
): Promise<DistributionResult> {
  // In a real implementation, check database for existing assignment
  // For now, use deterministic assignment
  return assignVariation(userId, contentId, variations);
}

/**
 * Track variation view
 */
export async function trackVariationView(
  userId: string,
  contentId: string,
  variationId: string
): Promise<void> {
  // In a real implementation, store in database
  console.log('Tracking variation view:', { userId, contentId, variationId });
}

/**
 * Get variation statistics
 */
export function calculateVariationStats(
  variations: Array<{
    id: string;
    name: string;
    views: number;
    engagements: number;
  }>
) {
  const totalViews = variations.reduce((sum, v) => sum + v.views, 0);
  const totalEngagements = variations.reduce((sum, v) => sum + v.engagements, 0);

  return variations.map(variation => {
    const engagementRate = variation.views > 0 
      ? (variation.engagements / variation.views) * 100 
      : 0;

    const viewShare = totalViews > 0 
      ? (variation.views / totalViews) * 100 
      : 0;

    return {
      ...variation,
      engagementRate: Number(engagementRate.toFixed(2)),
      viewShare: Number(viewShare.toFixed(2)),
    };
  });
}

/**
 * Determine winning variation based on statistical significance
 */
export function determineWinner(
  variations: Array<{
    id: string;
    name: string;
    views: number;
    engagements: number;
  }>
): {
  winnerId: string | null;
  winnerName: string | null;
  confidence: number;
  isSignificant: boolean;
} {
  if (variations.length < 2) {
    return {
      winnerId: null,
      winnerName: null,
      confidence: 0,
      isSignificant: false,
    };
  }

  // Calculate engagement rates
  const stats = variations.map(v => ({
    ...v,
    rate: v.views > 0 ? v.engagements / v.views : 0,
  }));

  // Find best performing variation
  const sorted = [...stats].sort((a, b) => b.rate - a.rate);
  const best = sorted[0];
  const secondBest = sorted[1];

  // Simple significance test (minimum sample size and difference)
  const minSampleSize = 100;
  const minDifference = 0.05; // 5% difference

  const hasEnoughData = best.views >= minSampleSize && secondBest.views >= minSampleSize;
  const hasMeaningfulDifference = Math.abs(best.rate - secondBest.rate) >= minDifference;

  const isSignificant = hasEnoughData && hasMeaningfulDifference;
  const confidence = isSignificant 
    ? Math.min(95, 50 + (best.rate - secondBest.rate) * 500) 
    : 0;

  return {
    winnerId: isSignificant ? best.id : null,
    winnerName: isSignificant ? best.name : null,
    confidence: Number(confidence.toFixed(1)),
    isSignificant,
  };
}
