/**
 * RollbackController - Automatic rollback for canary deployments
 * 
 * Monitors error rate, latency p95, and cost thresholds.
 * Triggers automatic rollback when thresholds are exceeded.
 * 
 * Requirements: 4.4, 4.5, 4.6, 4.7 - Rollback triggers and execution
 * Property 6: Rollback trigger correctness
 */

import { MetricsCollector, getMetricsCollector } from './metrics-collector';
import { TrafficSplitter, getTrafficSplitter } from './traffic-splitter';

export type RollbackReason = 
  | 'error_rate_exceeded'
  | 'latency_exceeded'
  | 'cost_exceeded'
  | 'manual'
  | 'none';

export type RollbackStatus = 
  | 'monitoring'
  | 'triggered'
  | 'executing'
  | 'completed'
  | 'failed';

export interface RollbackThresholds {
  /** Error rate threshold (0-1), default 0.05 (5%) */
  errorRate: number;
  /** Latency p95 threshold in ms, default 5000 (5s) */
  latencyP95Ms: number;
  /** Cost per request threshold in USD, default 0.10 */
  costPerRequestUsd: number;
}

export interface RollbackDecision {
  /** Whether rollback should be triggered */
  shouldRollback: boolean;
  /** Reason for rollback */
  reason: RollbackReason;
  /** Current metrics that triggered the decision */
  metrics: {
    errorRate: number;
    latencyP95: number;
    avgCost: number;
  };
  /** Thresholds used for comparison */
  thresholds: RollbackThresholds;
  /** Detailed message */
  message: string;
}

export interface RollbackEvent {
  /** Event timestamp */
  timestamp: Date;
  /** Rollback reason */
  reason: RollbackReason;
  /** Status at time of event */
  status: RollbackStatus;
  /** Metrics at time of rollback */
  metrics: {
    errorRate: number;
    latencyP95: number;
    avgCost: number;
  };
  /** Duration of rollback execution in ms */
  durationMs?: number;
  /** Error message if failed */
  error?: string;
}

export interface RollbackControllerConfig {
  /** Thresholds for triggering rollback */
  thresholds: RollbackThresholds;
  /** Minimum requests before checking thresholds */
  minRequestsForCheck: number;
  /** Cooldown period after rollback in ms */
  cooldownMs: number;
  /** Callback when rollback is triggered */
  onRollback?: (event: RollbackEvent) => void;
}

const DEFAULT_THRESHOLDS: RollbackThresholds = {
  errorRate: 0.05, // 5%
  latencyP95Ms: 5000, // 5 seconds
  costPerRequestUsd: 0.10, // $0.10
};

const DEFAULT_CONFIG: RollbackControllerConfig = {
  thresholds: DEFAULT_THRESHOLDS,
  minRequestsForCheck: 100,
  cooldownMs: 60 * 1000, // 1 minute cooldown
};

/**
 * RollbackController service
 * 
 * Features:
 * - Automatic threshold monitoring
 * - Multi-criteria rollback triggers
 * - Rollback execution with logging
 * - Cooldown period to prevent flapping
 */
export class RollbackController {
  private config: RollbackControllerConfig;
  private metricsCollector: MetricsCollector;
  private trafficSplitter: TrafficSplitter;
  private status: RollbackStatus = 'monitoring';
  private lastRollbackAt: Date | null = null;
  private rollbackHistory: RollbackEvent[] = [];
  private static instance: RollbackController | null = null;

  constructor(
    config: Partial<RollbackControllerConfig> = {},
    metricsCollector?: MetricsCollector,
    trafficSplitter?: TrafficSplitter
  ) {
    this.config = { 
      ...DEFAULT_CONFIG, 
      ...config,
      thresholds: { ...DEFAULT_THRESHOLDS, ...config.thresholds },
    };
    this.metricsCollector = metricsCollector || getMetricsCollector();
    this.trafficSplitter = trafficSplitter || getTrafficSplitter();
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<RollbackControllerConfig>): RollbackController {
    if (!RollbackController.instance) {
      RollbackController.instance = new RollbackController(config);
    }
    return RollbackController.instance;
  }

  /**
   * Reset singleton instance (for testing)
   */
  static resetInstance(): void {
    RollbackController.instance = null;
  }

  /**
   * Check health metrics and decide if rollback is needed
   * 
   * Property 6: For any error rate > 5% OR latency p95 > 5s OR cost > threshold,
   * the controller SHALL trigger automatic rollback
   */
  checkHealth(): RollbackDecision {
    const foundryMetrics = this.metricsCollector.getProviderMetrics('foundry');
    
    const metrics = {
      errorRate: foundryMetrics.errorRate,
      latencyP95: foundryMetrics.latencyP95,
      avgCost: foundryMetrics.avgCostPerRequest,
    };

    // Check if we have enough data
    if (foundryMetrics.requestCount < this.config.minRequestsForCheck) {
      return {
        shouldRollback: false,
        reason: 'none',
        metrics,
        thresholds: this.config.thresholds,
        message: `Insufficient data: ${foundryMetrics.requestCount}/${this.config.minRequestsForCheck} requests`,
      };
    }

    // Check if in cooldown
    if (this.isInCooldown()) {
      return {
        shouldRollback: false,
        reason: 'none',
        metrics,
        thresholds: this.config.thresholds,
        message: 'In cooldown period after previous rollback',
      };
    }

    // Check error rate threshold
    if (metrics.errorRate > this.config.thresholds.errorRate) {
      return {
        shouldRollback: true,
        reason: 'error_rate_exceeded',
        metrics,
        thresholds: this.config.thresholds,
        message: `Error rate ${(metrics.errorRate * 100).toFixed(2)}% exceeds threshold ${(this.config.thresholds.errorRate * 100).toFixed(2)}%`,
      };
    }

    // Check latency threshold
    if (metrics.latencyP95 > this.config.thresholds.latencyP95Ms) {
      return {
        shouldRollback: true,
        reason: 'latency_exceeded',
        metrics,
        thresholds: this.config.thresholds,
        message: `Latency p95 ${metrics.latencyP95.toFixed(0)}ms exceeds threshold ${this.config.thresholds.latencyP95Ms}ms`,
      };
    }

    // Check cost threshold
    if (metrics.avgCost > this.config.thresholds.costPerRequestUsd) {
      return {
        shouldRollback: true,
        reason: 'cost_exceeded',
        metrics,
        thresholds: this.config.thresholds,
        message: `Cost $${metrics.avgCost.toFixed(4)}/req exceeds threshold $${this.config.thresholds.costPerRequestUsd}/req`,
      };
    }

    return {
      shouldRollback: false,
      reason: 'none',
      metrics,
      thresholds: this.config.thresholds,
      message: 'All metrics within thresholds',
    };
  }

  /**
   * Execute rollback - set traffic to 0% Foundry
   * 
   * Requirement 4.7: Rollback SHALL complete within 60 seconds
   */
  async executeRollback(reason: RollbackReason = 'manual'): Promise<RollbackEvent> {
    const startTime = Date.now();
    const foundryMetrics = this.metricsCollector.getProviderMetrics('foundry');
    
    const event: RollbackEvent = {
      timestamp: new Date(),
      reason,
      status: 'executing',
      metrics: {
        errorRate: foundryMetrics.errorRate,
        latencyP95: foundryMetrics.latencyP95,
        avgCost: foundryMetrics.avgCostPerRequest,
      },
    };

    this.status = 'executing';

    try {
      // Set traffic to 0% Foundry (100% Legacy)
      this.trafficSplitter.updatePercentage(0);

      const durationMs = Date.now() - startTime;
      
      event.status = 'completed';
      event.durationMs = durationMs;
      
      this.status = 'completed';
      this.lastRollbackAt = new Date();
      this.rollbackHistory.push(event);

      // Log rollback event
      console.log('[RollbackController] Rollback completed', {
        reason,
        durationMs,
        metrics: event.metrics,
      });

      // Call callback if configured
      if (this.config.onRollback) {
        this.config.onRollback(event);
      }

      return event;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      
      event.status = 'failed';
      event.durationMs = durationMs;
      event.error = error instanceof Error ? error.message : 'Unknown error';
      
      this.status = 'failed';
      this.rollbackHistory.push(event);

      console.error('[RollbackController] Rollback failed', {
        reason,
        error: event.error,
        durationMs,
      });

      throw error;
    }
  }

  /**
   * Check health and execute rollback if needed
   */
  async checkAndRollback(): Promise<RollbackDecision> {
    const decision = this.checkHealth();

    if (decision.shouldRollback) {
      this.status = 'triggered';
      await this.executeRollback(decision.reason);
    }

    return decision;
  }

  /**
   * Check if in cooldown period
   */
  private isInCooldown(): boolean {
    if (!this.lastRollbackAt) return false;
    
    const elapsed = Date.now() - this.lastRollbackAt.getTime();
    return elapsed < this.config.cooldownMs;
  }

  /**
   * Get current status
   */
  getStatus(): RollbackStatus {
    return this.status;
  }

  /**
   * Get rollback history
   */
  getHistory(): RollbackEvent[] {
    return [...this.rollbackHistory];
  }

  /**
   * Get last rollback event
   */
  getLastRollback(): RollbackEvent | null {
    return this.rollbackHistory.length > 0 
      ? this.rollbackHistory[this.rollbackHistory.length - 1]
      : null;
  }

  /**
   * Reset status to monitoring (after recovery)
   */
  resetStatus(): void {
    this.status = 'monitoring';
  }

  /**
   * Update thresholds
   */
  updateThresholds(thresholds: Partial<RollbackThresholds>): void {
    this.config.thresholds = { ...this.config.thresholds, ...thresholds };
  }

  /**
   * Get current thresholds
   */
  getThresholds(): RollbackThresholds {
    return { ...this.config.thresholds };
  }

  /**
   * Clear history (for testing)
   */
  clearHistory(): void {
    this.rollbackHistory = [];
    this.lastRollbackAt = null;
  }
}

/**
 * Convenience function to get rollback controller instance
 */
export function getRollbackController(
  config?: Partial<RollbackControllerConfig>
): RollbackController {
  return RollbackController.getInstance(config);
}
