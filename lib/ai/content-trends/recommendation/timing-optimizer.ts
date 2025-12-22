/**
 * Timing Optimizer
 * Determines optimal posting times based on trends, audience, and platform data
 */

import type {
  BrandProfile,
  TimingRecommendation,
  TimingStrategy,
  OptimalTimingSlot,
  ContentHistoryItem,
} from './types';
import type { Trend } from '../trend-detection/types';

export interface TimingFactors {
  trendUrgency: number;
  audienceActivity: number;
  competitionLevel: number;
  historicalPerformance: number;
}

export interface TimingConfig {
  timezone: string;
  lookAheadDays: number;
  minTrendWindowHours: number;
}

const DEFAULT_CONFIG: TimingConfig = {
  timezone: 'UTC',
  lookAheadDays: 7,
  minTrendWindowHours: 24,
};

export class TimingOptimizer {
  private config: TimingConfig;

  // Platform-specific optimal posting times (hour in 24h format)
  private platformOptimalTimes: Record<string, number[]> = {
    tiktok: [7, 9, 12, 15, 19, 21],
    instagram: [8, 11, 14, 17, 19, 21],
    youtube: [12, 15, 17, 20],
    twitter: [8, 12, 17, 21],
  };

  // Day of week engagement multipliers (0 = Sunday)
  private dayMultipliers: Record<string, number[]> = {
    tiktok: [0.9, 0.85, 1.0, 1.0, 1.1, 1.0, 0.95],
    instagram: [0.95, 0.9, 1.0, 1.05, 1.0, 0.95, 1.0],
    youtube: [1.1, 0.85, 0.9, 0.95, 1.0, 1.05, 1.1],
    twitter: [0.8, 1.0, 1.05, 1.0, 1.0, 0.9, 0.85],
  };

  constructor(config: Partial<TimingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate timing recommendation for content
   */
  generateRecommendation(
    brand: BrandProfile,
    trend: Trend,
    platform: string
  ): TimingRecommendation {
    const factors = this.calculateTimingFactors(brand, trend, platform);
    const strategy = this.determineStrategy(factors, trend);
    const optimalSlots = this.findOptimalSlots(brand, platform, trend);

    const bestSlot = optimalSlots[0];
    const suggestedDate = this.calculateSuggestedDate(strategy, trend, bestSlot);

    return {
      strategy,
      suggestedDate,
      suggestedTime: bestSlot ? this.formatTime(bestSlot.hour) : undefined,
      timezone: this.config.timezone,
      reasoning: this.generateReasoning(strategy, factors, trend),
      alternativeTimes: optimalSlots.slice(1, 4).map((s) => this.formatTime(s.hour)),
      trendWindowRemaining: this.calculateTrendWindow(trend),
    };
  }

  /**
   * Calculate timing factors
   */
  private calculateTimingFactors(
    brand: BrandProfile,
    trend: Trend,
    platform: string
  ): TimingFactors {
    return {
      trendUrgency: this.calculateTrendUrgency(trend),
      audienceActivity: this.calculateAudienceActivity(brand, platform),
      competitionLevel: this.calculateCompetitionLevel(trend),
      historicalPerformance: this.calculateHistoricalPerformance(brand, platform),
    };
  }

  /**
   * Calculate trend urgency based on phase and velocity
   */
  private calculateTrendUrgency(trend: Trend): number {
    const phaseUrgency: Record<string, number> = {
      emerging: 0.9,
      growing: 0.8,
      peak: 0.6,
      declining: 0.3,
      saturated: 0.1,
    };

    let urgency = phaseUrgency[trend.phase] || 0.5;

    // Boost urgency for high acceleration
    if (trend.metrics.velocity.accelerationRate > 0.3) {
      urgency = Math.min(1, urgency * 1.3);
    }

    // Boost urgency for arbitrage opportunities
    if (trend.arbitrageOpportunities.length > 0) {
      const bestOpportunity = trend.arbitrageOpportunities[0];
      if (bestOpportunity.estimatedWindow < 48) {
        urgency = Math.min(1, urgency * 1.4);
      }
    }

    return urgency;
  }

  /**
   * Calculate audience activity score for platform
   */
  private calculateAudienceActivity(brand: BrandProfile, platform: string): number {
    const platformPref = brand.platforms.find(
      (p) => p.platform.toLowerCase() === platform.toLowerCase()
    );

    if (!platformPref) return 0.5;

    // Higher priority platforms have more engaged audiences
    return Math.min(1, platformPref.priority / 10 + 0.3);
  }

  /**
   * Calculate competition level based on trend saturation
   */
  private calculateCompetitionLevel(trend: Trend): number {
    const { totalContent } = trend.metrics;

    // More content = more competition
    if (totalContent > 10000) return 0.9;
    if (totalContent > 5000) return 0.7;
    if (totalContent > 1000) return 0.5;
    if (totalContent > 100) return 0.3;
    return 0.1;
  }

  /**
   * Calculate historical performance score
   */
  private calculateHistoricalPerformance(brand: BrandProfile, platform: string): number {
    if (!brand.contentHistory || brand.contentHistory.length === 0) {
      return 0.5;
    }

    const platformContent = brand.contentHistory.filter(
      (c) => c.platform.toLowerCase() === platform.toLowerCase()
    );

    if (platformContent.length === 0) return 0.5;

    const avgEngagement =
      platformContent.reduce((sum, c) => sum + c.performance.engagementRate, 0) /
      platformContent.length;

    return Math.min(1, avgEngagement * 10);
  }

  /**
   * Determine timing strategy based on factors
   */
  private determineStrategy(factors: TimingFactors, trend: Trend): TimingStrategy {
    const { trendUrgency, competitionLevel } = factors;

    // Immediate for very urgent trends
    if (trendUrgency > 0.85) {
      return 'immediate';
    }

    // Trend-aligned for emerging trends with low competition
    if (trend.phase === 'emerging' && competitionLevel < 0.4) {
      return 'trend-aligned';
    }

    // Optimal for most cases
    if (trendUrgency > 0.5) {
      return 'optimal';
    }

    // Scheduled for lower urgency
    return 'scheduled';
  }

  /**
   * Find optimal posting slots
   */
  private findOptimalSlots(
    brand: BrandProfile,
    platform: string,
    trend: Trend
  ): OptimalTimingSlot[] {
    const slots: OptimalTimingSlot[] = [];
    const platformTimes = this.platformOptimalTimes[platform.toLowerCase()] || [12, 18];
    const dayMults = this.dayMultipliers[platform.toLowerCase()] || [1, 1, 1, 1, 1, 1, 1];

    // Get brand's preferred times if available
    const platformPref = brand.platforms.find(
      (p) => p.platform.toLowerCase() === platform.toLowerCase()
    );
    const preferredTimes = platformPref?.bestTimes?.map((t) => parseInt(t.split(':')[0])) || [];

    // Combine platform optimal times with brand preferences
    const candidateTimes = [...new Set([...platformTimes, ...preferredTimes])];

    for (let day = 0; day < 7; day++) {
      for (const hour of candidateTimes) {
        const baseScore = this.calculateBaseTimeScore(hour, platform);
        const dayMultiplier = dayMults[day];
        const preferenceBonus = preferredTimes.includes(hour) ? 0.1 : 0;
        const historicalBonus = this.getHistoricalTimeBonus(brand, platform, day, hour);

        const score = (baseScore * dayMultiplier + preferenceBonus + historicalBonus);

        slots.push({
          dayOfWeek: day,
          hour,
          score,
          reasoning: this.generateSlotReasoning(day, hour, platform, score),
        });
      }
    }

    return slots.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate base score for a specific time
   */
  private calculateBaseTimeScore(hour: number, platform: string): number {
    const optimalTimes = this.platformOptimalTimes[platform.toLowerCase()] || [];
    
    if (optimalTimes.includes(hour)) {
      return 1.0;
    }

    // Score based on proximity to optimal times
    const minDistance = Math.min(
      ...optimalTimes.map((t) => Math.abs(t - hour))
    );

    return Math.max(0.3, 1 - minDistance * 0.1);
  }

  /**
   * Get historical performance bonus for specific time slot
   */
  private getHistoricalTimeBonus(
    brand: BrandProfile,
    platform: string,
    day: number,
    hour: number
  ): number {
    if (!brand.contentHistory) return 0;

    const relevantContent = brand.contentHistory.filter((c) => {
      if (c.platform.toLowerCase() !== platform.toLowerCase()) return false;
      const publishDay = c.publishedAt.getDay();
      const publishHour = c.publishedAt.getHours();
      return publishDay === day && Math.abs(publishHour - hour) <= 1;
    });

    if (relevantContent.length === 0) return 0;

    const avgEngagement =
      relevantContent.reduce((sum, c) => sum + c.performance.engagementRate, 0) /
      relevantContent.length;

    return Math.min(0.2, avgEngagement * 2);
  }

  /**
   * Calculate suggested date based on strategy
   */
  private calculateSuggestedDate(
    strategy: TimingStrategy,
    trend: Trend,
    bestSlot?: OptimalTimingSlot
  ): Date {
    const now = new Date();

    switch (strategy) {
      case 'immediate':
        return now;

      case 'trend-aligned': {
        // Post before predicted peak
        if (trend.predictedPeakDate) {
          const daysBeforePeak = 2;
          const targetDate = new Date(trend.predictedPeakDate);
          targetDate.setDate(targetDate.getDate() - daysBeforePeak);
          return targetDate > now ? targetDate : now;
        }
        return now;
      }

      case 'optimal': {
        if (!bestSlot) return now;
        
        // Find next occurrence of best slot
        const targetDate = new Date(now);
        const currentDay = now.getDay();
        const daysUntilSlot = (bestSlot.dayOfWeek - currentDay + 7) % 7;
        
        targetDate.setDate(targetDate.getDate() + (daysUntilSlot || 7));
        targetDate.setHours(bestSlot.hour, 0, 0, 0);
        
        return targetDate;
      }

      case 'scheduled':
      default: {
        // Schedule for next week at best time
        const targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() + 7);
        if (bestSlot) {
          targetDate.setHours(bestSlot.hour, 0, 0, 0);
        }
        return targetDate;
      }
    }
  }

  /**
   * Calculate remaining trend window in hours
   */
  private calculateTrendWindow(trend: Trend): number {
    if (trend.phase === 'declining' || trend.phase === 'saturated') {
      return 0;
    }

    if (trend.predictedPeakDate) {
      const hoursUntilPeak =
        (trend.predictedPeakDate.getTime() - Date.now()) / (1000 * 60 * 60);
      return Math.max(0, hoursUntilPeak);
    }

    // Default estimates based on phase
    const phaseWindows: Record<string, number> = {
      emerging: 168, // 1 week
      growing: 120, // 5 days
      peak: 48, // 2 days
    };

    return phaseWindows[trend.phase] || 72;
  }

  /**
   * Generate reasoning for timing recommendation
   */
  private generateReasoning(
    strategy: TimingStrategy,
    factors: TimingFactors,
    trend: Trend
  ): string {
    const parts: string[] = [];

    switch (strategy) {
      case 'immediate':
        parts.push('Immediate posting recommended due to high trend urgency.');
        if (factors.trendUrgency > 0.9) {
          parts.push('Trend is rapidly accelerating.');
        }
        break;

      case 'trend-aligned':
        parts.push('Timing aligned with trend trajectory for maximum impact.');
        if (trend.phase === 'emerging') {
          parts.push('Early adoption window available.');
        }
        break;

      case 'optimal':
        parts.push('Optimal timing based on audience activity patterns.');
        if (factors.historicalPerformance > 0.6) {
          parts.push('Historical data supports this timing.');
        }
        break;

      case 'scheduled':
        parts.push('Scheduled posting for consistent content cadence.');
        break;
    }

    if (factors.competitionLevel > 0.7) {
      parts.push('High competition - differentiation is key.');
    }

    return parts.join(' ');
  }

  /**
   * Generate reasoning for specific time slot
   */
  private generateSlotReasoning(
    day: number,
    hour: number,
    platform: string,
    score: number
  ): string {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[day];
    const timeStr = this.formatTime(hour);

    if (score > 0.9) {
      return `${dayName} at ${timeStr} is a peak engagement time for ${platform}.`;
    } else if (score > 0.7) {
      return `${dayName} at ${timeStr} shows strong engagement potential.`;
    } else {
      return `${dayName} at ${timeStr} is a viable posting time.`;
    }
  }

  /**
   * Format hour to time string
   */
  private formatTime(hour: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  }
}
