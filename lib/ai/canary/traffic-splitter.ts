/**
 * TrafficSplitter - Canary deployment traffic distribution service
 * 
 * Implements percentage-based routing with consistent hashing for user stickiness.
 * Tracks traffic distribution metrics for monitoring and validation.
 * 
 * Requirements: 4.1 - Canary traffic distribution
 * Property 5: Canary traffic distribution - percentage within ±5% of configured
 */

import { createHash } from 'crypto';

export type ProviderType = 'foundry' | 'legacy';

export interface TrafficMetrics {
  /** Total requests processed */
  totalRequests: number;
  /** Requests routed to Foundry */
  foundryRequests: number;
  /** Requests routed to Legacy */
  legacyRequests: number;
  /** Actual Foundry percentage */
  actualFoundryPercentage: number;
  /** Configured target percentage */
  targetPercentage: number;
  /** Deviation from target */
  deviationPercentage: number;
  /** Timestamp of last request */
  lastRequestAt: Date | null;
  /** Metrics window start */
  windowStartAt: Date;
}

export interface TrafficSplitterConfig {
  /** Target percentage for Foundry (0-100) */
  percentage: number;
  /** Use consistent hashing for user stickiness */
  enableStickiness: boolean;
  /** Metrics window duration in milliseconds (default: 1 hour) */
  metricsWindowMs: number;
}

const DEFAULT_CONFIG: TrafficSplitterConfig = {
  percentage: 10,
  enableStickiness: true,
  metricsWindowMs: 60 * 60 * 1000, // 1 hour
};

/**
 * TrafficSplitter service for canary deployments
 * 
 * Features:
 * - Percentage-based traffic routing
 * - Consistent hashing for user stickiness
 * - Real-time metrics tracking
 * - Automatic metrics window rotation
 */
export class TrafficSplitter {
  private config: TrafficSplitterConfig;
  private metrics: TrafficMetrics;
  private static instance: TrafficSplitter | null = null;

  constructor(config: Partial<TrafficSplitterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.metrics = this.initializeMetrics();
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<TrafficSplitterConfig>): TrafficSplitter {
    if (!TrafficSplitter.instance) {
      TrafficSplitter.instance = new TrafficSplitter(config);
    }
    return TrafficSplitter.instance;
  }

  /**
   * Reset singleton instance (for testing)
   */
  static resetInstance(): void {
    TrafficSplitter.instance = null;
  }

  /**
   * Initialize metrics structure
   */
  private initializeMetrics(): TrafficMetrics {
    return {
      totalRequests: 0,
      foundryRequests: 0,
      legacyRequests: 0,
      actualFoundryPercentage: 0,
      targetPercentage: this.config.percentage,
      deviationPercentage: 0,
      lastRequestAt: null,
      windowStartAt: new Date(),
    };
  }

  /**
   * Determine if request should use Foundry
   * 
   * @param requestId - Unique request identifier
   * @param userId - Optional user ID for sticky routing
   * @returns true if request should use Foundry
   */
  shouldUseFoundry(requestId: string, userId?: string): boolean {
    // Check if metrics window needs rotation
    this.maybeRotateMetricsWindow();

    let useFoundry: boolean;

    if (this.config.enableStickiness && userId) {
      // Use consistent hashing for user stickiness
      useFoundry = this.hashToPercentage(userId) < this.config.percentage;
    } else {
      // Use request ID for deterministic but distributed routing
      useFoundry = this.hashToPercentage(requestId) < this.config.percentage;
    }

    // Update metrics
    this.recordDecision(useFoundry);

    return useFoundry;
  }

  /**
   * Get the provider to use for a request
   * 
   * @param requestId - Unique request identifier
   * @param userId - Optional user ID for sticky routing
   * @returns Provider type to use
   */
  getProvider(requestId: string, userId?: string): ProviderType {
    return this.shouldUseFoundry(requestId, userId) ? 'foundry' : 'legacy';
  }

  /**
   * Hash a string to a percentage (0-99)
   * Uses SHA-256 for uniform distribution
   * 
   * @param input - String to hash
   * @returns Number between 0-99
   */
  private hashToPercentage(input: string): number {
    const hash = createHash('sha256').update(input).digest();
    // Use first 4 bytes as unsigned 32-bit integer
    const value = hash.readUInt32BE(0);
    // Map to 0-99 range
    return value % 100;
  }

  /**
   * Record a routing decision in metrics
   */
  private recordDecision(useFoundry: boolean): void {
    this.metrics.totalRequests++;
    if (useFoundry) {
      this.metrics.foundryRequests++;
    } else {
      this.metrics.legacyRequests++;
    }
    this.metrics.lastRequestAt = new Date();
    this.updateCalculatedMetrics();
  }

  /**
   * Update calculated metrics (percentages, deviation)
   */
  private updateCalculatedMetrics(): void {
    if (this.metrics.totalRequests > 0) {
      this.metrics.actualFoundryPercentage = 
        (this.metrics.foundryRequests / this.metrics.totalRequests) * 100;
      this.metrics.deviationPercentage = 
        Math.abs(this.metrics.actualFoundryPercentage - this.config.percentage);
    }
    this.metrics.targetPercentage = this.config.percentage;
  }

  /**
   * Check and rotate metrics window if needed
   */
  private maybeRotateMetricsWindow(): void {
    const now = new Date();
    const windowAge = now.getTime() - this.metrics.windowStartAt.getTime();
    
    if (windowAge >= this.config.metricsWindowMs) {
      this.metrics = this.initializeMetrics();
    }
  }

  /**
   * Update the traffic percentage
   * 
   * @param newPercentage - New percentage (0-100)
   */
  updatePercentage(newPercentage: number): void {
    if (newPercentage < 0 || newPercentage > 100) {
      throw new Error(`Invalid percentage: ${newPercentage}. Must be between 0 and 100.`);
    }
    this.config.percentage = newPercentage;
    this.updateCalculatedMetrics();
  }

  /**
   * Get current percentage
   */
  getPercentage(): number {
    return this.config.percentage;
  }

  /**
   * Get current traffic metrics
   */
  getMetrics(): TrafficMetrics {
    return { ...this.metrics };
  }

  /**
   * Check if traffic distribution is within acceptable deviation
   * Property 5: Distribution should be within ±5% of target
   * 
   * @param tolerancePercent - Acceptable deviation (default: 5%)
   * @returns true if distribution is within tolerance
   */
  isDistributionHealthy(tolerancePercent: number = 5): boolean {
    // Need minimum sample size for statistical significance
    if (this.metrics.totalRequests < 100) {
      return true; // Not enough data to judge
    }
    return this.metrics.deviationPercentage <= tolerancePercent;
  }

  /**
   * Reset metrics (for testing or manual reset)
   */
  resetMetrics(): void {
    this.metrics = this.initializeMetrics();
  }

  /**
   * Get configuration (for debugging)
   */
  getConfig(): Readonly<TrafficSplitterConfig> {
    return { ...this.config };
  }

  /**
   * Set configuration (for testing)
   */
  setConfig(config: Partial<TrafficSplitterConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Convenience function to get traffic splitter instance
 */
export function getTrafficSplitter(config?: Partial<TrafficSplitterConfig>): TrafficSplitter {
  return TrafficSplitter.getInstance(config);
}

/**
 * Convenience function to determine provider for a request
 */
export function getProviderForRequest(
  requestId: string, 
  userId?: string,
  config?: Partial<TrafficSplitterConfig>
): ProviderType {
  return TrafficSplitter.getInstance(config).getProvider(requestId, userId);
}
