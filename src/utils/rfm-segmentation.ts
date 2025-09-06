export interface FanMetrics {
  userId: string;
  username: string;
  lastInteraction: Date;
  totalSpent: number;
  transactionCount: number;
  messageCount: number;
  avgTransactionValue: number;
  daysSinceLastInteraction: number;
}

export interface RFMScore {
  recency: number; // 1-5, 5 being most recent
  frequency: number; // 1-5, 5 being most frequent
  monetary: number; // 1-5, 5 being highest value
  segment: RFMSegment;
  score: number; // Combined score
}

export type RFMSegment = 
  | 'WHALE'      // High value, frequent, recent (5,4-5,4-5)
  | 'VIP'        // Good value, regular activity (4-5,3-4,3-4)
  | 'CASUAL'     // Average across metrics (2-3,2-3,2-3)
  | 'CHURN_RISK' // Was active but declining (1-2,*,*)
  | 'NEW'        // Recent but low history (<30 days, low frequency)
  | 'UNKNOWN';   // Insufficient data

export interface RFMThresholds {
  recency: number[]; // Days thresholds [7, 30, 60, 90]
  frequency: number[]; // Transaction count thresholds [1, 5, 10, 20]
  monetary: number[]; // Total spent thresholds [10, 50, 200, 500]
}

const DEFAULT_THRESHOLDS: RFMThresholds = {
  recency: [7, 30, 60, 90], // days
  frequency: [1, 5, 10, 20], // transactions
  monetary: [10, 50, 200, 500] // dollars
};

/**
 * Calculate RFM score for a single fan
 */
export function calculateRFMScore(
  metrics: FanMetrics,
  thresholds: RFMThresholds = DEFAULT_THRESHOLDS
): RFMScore {
  // Calculate individual scores
  const recencyScore = calculateRecencyScore(metrics.daysSinceLastInteraction, thresholds.recency);
  const frequencyScore = calculateFrequencyScore(metrics.transactionCount, thresholds.frequency);
  const monetaryScore = calculateMonetaryScore(metrics.totalSpent, thresholds.monetary);
  
  // Determine segment
  const segment = determineSegment(recencyScore, frequencyScore, monetaryScore, metrics);
  
  // Calculate combined score (weighted)
  const score = (recencyScore * 0.3) + (frequencyScore * 0.3) + (monetaryScore * 0.4);
  
  return {
    recency: recencyScore,
    frequency: frequencyScore,
    monetary: monetaryScore,
    segment,
    score
  };
}

/**
 * Calculate recency score (1-5, 5 being most recent)
 */
function calculateRecencyScore(daysSince: number, thresholds: number[]): number {
  if (daysSince <= thresholds[0]) return 5;
  if (daysSince <= thresholds[1]) return 4;
  if (daysSince <= thresholds[2]) return 3;
  if (daysSince <= thresholds[3]) return 2;
  return 1;
}

/**
 * Calculate frequency score (1-5, 5 being most frequent)
 */
function calculateFrequencyScore(transactionCount: number, thresholds: number[]): number {
  if (transactionCount >= thresholds[3]) return 5;
  if (transactionCount >= thresholds[2]) return 4;
  if (transactionCount >= thresholds[1]) return 3;
  if (transactionCount >= thresholds[0]) return 2;
  return 1;
}

/**
 * Calculate monetary score (1-5, 5 being highest value)
 */
function calculateMonetaryScore(totalSpent: number, thresholds: number[]): number {
  if (totalSpent >= thresholds[3]) return 5;
  if (totalSpent >= thresholds[2]) return 4;
  if (totalSpent >= thresholds[1]) return 3;
  if (totalSpent >= thresholds[0]) return 2;
  return 1;
}

/**
 * Determine RFM segment based on scores
 */
function determineSegment(
  recency: number,
  frequency: number,
  monetary: number,
  metrics: FanMetrics
): RFMSegment {
  // Check if new fan
  if (metrics.daysSinceLastInteraction < 30 && metrics.transactionCount <= 2) {
    return 'NEW';
  }
  
  // WHALE: High value across all metrics
  if (recency >= 4 && frequency >= 4 && monetary >= 4) {
    return 'WHALE';
  }
  
  // VIP: Good value, regular activity
  if (recency >= 3 && frequency >= 3 && monetary >= 3) {
    return 'VIP';
  }
  
  // CHURN_RISK: Was active but declining
  if (recency <= 2) {
    return 'CHURN_RISK';
  }
  
  // CASUAL: Everyone else with some activity
  if (metrics.transactionCount > 0) {
    return 'CASUAL';
  }
  
  return 'UNKNOWN';
}

/**
 * Calculate RFM scores for multiple fans
 */
export function calculateBulkRFMScores(
  fanMetrics: FanMetrics[],
  customThresholds?: RFMThresholds
): Map<string, RFMScore> {
  const results = new Map<string, RFMScore>();
  
  // Calculate dynamic thresholds if not provided
  const thresholds = customThresholds || calculateDynamicThresholds(fanMetrics);
  
  fanMetrics.forEach(metrics => {
    const score = calculateRFMScore(metrics, thresholds);
    results.set(metrics.userId, score);
  });
  
  return results;
}

/**
 * Calculate dynamic thresholds based on data distribution
 */
export function calculateDynamicThresholds(fanMetrics: FanMetrics[]): RFMThresholds {
  if (fanMetrics.length === 0) return DEFAULT_THRESHOLDS;
  
  const recencyValues = fanMetrics.map(m => m.daysSinceLastInteraction).sort((a, b) => a - b);
  const frequencyValues = fanMetrics.map(m => m.transactionCount).sort((a, b) => a - b);
  const monetaryValues = fanMetrics.map(m => m.totalSpent).sort((a, b) => a - b);
  
  return {
    recency: getPercentileValues(recencyValues, [20, 40, 60, 80]),
    frequency: getPercentileValues(frequencyValues, [20, 40, 60, 80]),
    monetary: getPercentileValues(monetaryValues, [20, 40, 60, 80])
  };
}

/**
 * Get values at specific percentiles
 */
function getPercentileValues(sortedArray: number[], percentiles: number[]): number[] {
  return percentiles.map(p => {
    const index = Math.floor(sortedArray.length * (p / 100));
    return sortedArray[Math.min(index, sortedArray.length - 1)];
  });
}

/**
 * Get segment distribution statistics
 */
export function getSegmentDistribution(scores: Map<string, RFMScore>): Record<RFMSegment, number> {
  const distribution: Record<string, number> = {
    WHALE: 0,
    VIP: 0,
    CASUAL: 0,
    CHURN_RISK: 0,
    NEW: 0,
    UNKNOWN: 0
  };
  
  scores.forEach(score => {
    distribution[score.segment]++;
  });
  
  return distribution as Record<RFMSegment, number>;
}

/**
 * Get action recommendations based on segment
 */
export function getSegmentRecommendations(segment: RFMSegment): {
  priority: 'high' | 'medium' | 'low';
  actions: string[];
  messageStrategy: string;
  ppvStrategy: string;
} {
  const recommendations = {
    WHALE: {
      priority: 'high' as const,
      actions: [
        'Provide exclusive content regularly',
        'Offer personalized experiences',
        'Quick response times',
        'VIP treatment and early access'
      ],
      messageStrategy: 'Personalized, appreciative, exclusive offers',
      ppvStrategy: 'Premium pricing ($50-200), exclusive bundles'
    },
    VIP: {
      priority: 'high' as const,
      actions: [
        'Maintain regular engagement',
        'Upsell to whale tier',
        'Reward loyalty',
        'Exclusive content previews'
      ],
      messageStrategy: 'Friendly, engaging, occasional exclusive offers',
      ppvStrategy: 'Mid-range pricing ($20-50), loyalty discounts'
    },
    CASUAL: {
      priority: 'medium' as const,
      actions: [
        'Increase engagement frequency',
        'Find content preferences',
        'Encourage more interaction',
        'Small incentives'
      ],
      messageStrategy: 'Welcoming, discovery-focused, value highlights',
      ppvStrategy: 'Entry pricing ($5-20), bundle deals'
    },
    CHURN_RISK: {
      priority: 'high' as const,
      actions: [
        'Re-engagement campaign',
        'Special comeback offers',
        'Survey for feedback',
        'Exclusive reactivation content'
      ],
      messageStrategy: 'Win-back focus, special offers, show you care',
      ppvStrategy: 'Discount pricing, limited-time offers'
    },
    NEW: {
      priority: 'medium' as const,
      actions: [
        'Welcome sequence',
        'Introduce content types',
        'Build relationship',
        'First purchase incentive'
      ],
      messageStrategy: 'Welcoming, educational, first-timer offers',
      ppvStrategy: 'Introductory pricing, starter bundles'
    },
    UNKNOWN: {
      priority: 'low' as const,
      actions: [
        'Gather more data',
        'Basic engagement attempts',
        'Monitor activity'
      ],
      messageStrategy: 'Generic friendly messages',
      ppvStrategy: 'Standard pricing'
    }
  };
  
  return recommendations[segment];
}