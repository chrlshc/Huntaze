/**
 * Velocity Calculator
 * Calculates trend velocity and acceleration metrics
 */

import type {
  TrendVelocity,
  TrendMetrics,
  TrendSnapshot,
  TrendPhase,
} from './types';

export interface VelocityDataPoint {
  timestamp: Date;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  contentCount: number;
}

export interface VelocityCalculationResult {
  velocity: TrendVelocity;
  phase: TrendPhase;
  accelerationTrend: 'accelerating' | 'stable' | 'decelerating';
  peakProbability: number;
}

export class VelocityCalculator {
  private readonly minDataPoints = 3;
  private readonly accelerationThreshold = 0.1;
  private readonly decelerationThreshold = -0.1;

  /**
   * Calculate velocity from time-series data points
   */
  calculateVelocity(dataPoints: VelocityDataPoint[]): TrendVelocity {
    if (dataPoints.length < 2) {
      return this.createZeroVelocity();
    }

    const sorted = [...dataPoints].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const hoursDiff = this.getHoursDifference(first.timestamp, last.timestamp);

    if (hoursDiff === 0) {
      return this.createZeroVelocity();
    }

    const viewsDelta = last.views - first.views;
    const likesDelta = last.likes - first.likes;
    const sharesDelta = last.shares - first.shares;
    const commentsDelta = last.comments - first.comments;
    const contentDelta = last.contentCount - first.contentCount;

    const velocity: TrendVelocity = {
      viewsPerHour: Math.max(0, viewsDelta / hoursDiff),
      likesPerHour: Math.max(0, likesDelta / hoursDiff),
      sharesPerHour: Math.max(0, sharesDelta / hoursDiff),
      commentsPerHour: Math.max(0, commentsDelta / hoursDiff),
      newContentPerHour: Math.max(0, contentDelta / hoursDiff),
      accelerationRate: this.calculateAcceleration(sorted),
    };

    return velocity;
  }

  /**
   * Calculate acceleration rate (change in velocity over time)
   */
  private calculateAcceleration(dataPoints: VelocityDataPoint[]): number {
    if (dataPoints.length < this.minDataPoints) {
      return 0;
    }

    // Split into two halves and compare velocities
    const midpoint = Math.floor(dataPoints.length / 2);
    const firstHalf = dataPoints.slice(0, midpoint + 1);
    const secondHalf = dataPoints.slice(midpoint);

    const firstVelocity = this.calculateSimpleVelocity(firstHalf);
    const secondVelocity = this.calculateSimpleVelocity(secondHalf);

    if (firstVelocity === 0) {
      return secondVelocity > 0 ? 1 : 0;
    }

    return (secondVelocity - firstVelocity) / firstVelocity;
  }

  /**
   * Calculate simple velocity (views per hour) for a subset
   */
  private calculateSimpleVelocity(dataPoints: VelocityDataPoint[]): number {
    if (dataPoints.length < 2) return 0;

    const first = dataPoints[0];
    const last = dataPoints[dataPoints.length - 1];
    const hours = this.getHoursDifference(first.timestamp, last.timestamp);

    if (hours === 0) return 0;
    return (last.views - first.views) / hours;
  }

  /**
   * Determine trend phase based on velocity and acceleration
   */
  determineTrendPhase(
    velocity: TrendVelocity,
    historicalSnapshots: TrendSnapshot[]
  ): TrendPhase {
    const { accelerationRate } = velocity;
    const totalVelocity = this.getTotalVelocityScore(velocity);

    // Check if we have peak data
    const peakVelocity = this.findPeakVelocity(historicalSnapshots);
    const currentToPeakRatio = peakVelocity > 0 ? totalVelocity / peakVelocity : 1;

    // Emerging: Low velocity but accelerating
    if (totalVelocity < 100 && accelerationRate > this.accelerationThreshold) {
      return 'emerging';
    }

    // Growing: Moderate velocity and accelerating
    if (accelerationRate > this.accelerationThreshold) {
      return 'growing';
    }

    // Peak: High velocity, stable or just starting to decelerate
    if (
      currentToPeakRatio > 0.9 &&
      accelerationRate > this.decelerationThreshold
    ) {
      return 'peak';
    }

    // Declining: Decelerating but still has activity
    if (
      accelerationRate < this.decelerationThreshold &&
      totalVelocity > 10
    ) {
      return 'declining';
    }

    // Saturated: Very low velocity
    if (totalVelocity < 10) {
      return 'saturated';
    }

    return 'peak';
  }

  /**
   * Calculate comprehensive velocity result
   */
  analyze(
    dataPoints: VelocityDataPoint[],
    historicalSnapshots: TrendSnapshot[] = []
  ): VelocityCalculationResult {
    const velocity = this.calculateVelocity(dataPoints);
    const phase = this.determineTrendPhase(velocity, historicalSnapshots);

    let accelerationTrend: 'accelerating' | 'stable' | 'decelerating';
    if (velocity.accelerationRate > this.accelerationThreshold) {
      accelerationTrend = 'accelerating';
    } else if (velocity.accelerationRate < this.decelerationThreshold) {
      accelerationTrend = 'decelerating';
    } else {
      accelerationTrend = 'stable';
    }

    const peakProbability = this.calculatePeakProbability(
      velocity,
      phase,
      historicalSnapshots
    );

    return {
      velocity,
      phase,
      accelerationTrend,
      peakProbability,
    };
  }

  /**
   * Calculate probability that trend is at or near peak
   */
  private calculatePeakProbability(
    velocity: TrendVelocity,
    phase: TrendPhase,
    snapshots: TrendSnapshot[]
  ): number {
    if (phase === 'peak') return 0.9;
    if (phase === 'declining' || phase === 'saturated') return 0.1;

    // For emerging/growing, estimate based on acceleration trend
    const { accelerationRate } = velocity;

    if (accelerationRate > 0.5) return 0.2; // Still accelerating fast
    if (accelerationRate > 0.2) return 0.4;
    if (accelerationRate > 0) return 0.6;

    return 0.7; // Slowing down, approaching peak
  }

  /**
   * Find peak velocity from historical snapshots
   */
  private findPeakVelocity(snapshots: TrendSnapshot[]): number {
    if (snapshots.length === 0) return 0;

    return Math.max(
      ...snapshots.map((s) => this.getTotalVelocityScore(s.metrics.velocity))
    );
  }

  /**
   * Get composite velocity score
   */
  private getTotalVelocityScore(velocity: TrendVelocity): number {
    return (
      velocity.viewsPerHour * 1 +
      velocity.likesPerHour * 2 +
      velocity.sharesPerHour * 5 +
      velocity.commentsPerHour * 3 +
      velocity.newContentPerHour * 10
    );
  }

  /**
   * Get hours difference between two dates
   */
  private getHoursDifference(start: Date, end: Date): number {
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }

  /**
   * Create zero velocity object
   */
  private createZeroVelocity(): TrendVelocity {
    return {
      viewsPerHour: 0,
      likesPerHour: 0,
      sharesPerHour: 0,
      commentsPerHour: 0,
      newContentPerHour: 0,
      accelerationRate: 0,
    };
  }
}
