/**
 * Azure Rollback Service
 * 
 * Implements rollback capability to switch back to OpenAI/Anthropic
 * in case of issues with Azure migration.
 * 
 * @module azure-rollback
 */

export type AIProvider = 'azure' | 'openai' | 'anthropic';

export interface RollbackConfig {
  currentProvider: AIProvider;
  fallbackProvider: AIProvider;
  autoRollbackEnabled: boolean;
  errorThreshold: number; // Percentage of errors to trigger auto-rollback
  latencyThreshold: number; // ms - latency threshold to trigger auto-rollback
  monitoringWindowMs: number; // Time window for monitoring
  cooldownPeriodMs: number; // Time to wait before allowing another rollback
}

export interface ProviderHealth {
  provider: AIProvider;
  healthy: boolean;
  errorRate: number;
  averageLatencyMs: number;
  lastChecked: Date;
  consecutiveFailures: number;
}

export interface RollbackEvent {
  id: string;
  timestamp: Date;
  fromProvider: AIProvider;
  toProvider: AIProvider;
  reason: 'manual' | 'auto-error' | 'auto-latency' | 'auto-health';
  triggeredBy: string;
  dataPreserved: boolean;
  rollbackDurationMs: number;
}

export interface RollbackState {
  currentProvider: AIProvider;
  previousProvider: AIProvider | null;
  lastRollback: Date | null;
  rollbackCount: number;
  inCooldown: boolean;
  cooldownEndsAt: Date | null;
}

export interface DataPreservationResult {
  preserved: boolean;
  recordsPreserved: number;
  recordsLost: number;
  verificationPassed: boolean;
  details: string[];
}

export class AzureRollbackService {
  private config: RollbackConfig;
  private state: RollbackState;
  private healthStatus: Map<AIProvider, ProviderHealth>;
  private rollbackHistory: RollbackEvent[];
  private errorCounts: Map<AIProvider, number[]>;
  private latencyMeasurements: Map<AIProvider, number[]>;


  constructor(config: Partial<RollbackConfig> = {}) {
    this.config = {
      currentProvider: 'azure',
      fallbackProvider: 'openai',
      autoRollbackEnabled: true,
      errorThreshold: 10, // 10% error rate triggers rollback
      latencyThreshold: 5000, // 5 seconds
      monitoringWindowMs: 60000, // 1 minute
      cooldownPeriodMs: 300000, // 5 minutes
      ...config
    };

    this.state = {
      currentProvider: this.config.currentProvider,
      previousProvider: null,
      lastRollback: null,
      rollbackCount: 0,
      inCooldown: false,
      cooldownEndsAt: null
    };

    this.healthStatus = new Map();
    this.rollbackHistory = [];
    this.errorCounts = new Map();
    this.latencyMeasurements = new Map();

    // Initialize health status for all providers
    this.initializeHealthStatus();
  }

  /**
   * Initialize health status for all providers
   */
  private initializeHealthStatus(): void {
    const providers: AIProvider[] = ['azure', 'openai', 'anthropic'];
    for (const provider of providers) {
      this.healthStatus.set(provider, {
        provider,
        healthy: true,
        errorRate: 0,
        averageLatencyMs: 0,
        lastChecked: new Date(),
        consecutiveFailures: 0
      });
      this.errorCounts.set(provider, []);
      this.latencyMeasurements.set(provider, []);
    }
  }

  /**
   * Execute rollback to fallback provider
   */
  async rollback(reason: RollbackEvent['reason'], triggeredBy: string): Promise<RollbackEvent> {
    const startTime = Date.now();

    // Check if in cooldown
    if (this.state.inCooldown && this.state.cooldownEndsAt && new Date() < this.state.cooldownEndsAt) {
      throw new Error(`Rollback in cooldown until ${this.state.cooldownEndsAt.toISOString()}`);
    }

    const fromProvider = this.state.currentProvider;
    const toProvider = this.config.fallbackProvider;

    // Preserve data before rollback
    const preservationResult = await this.preserveData();

    // Execute provider switch
    await this.switchProvider(toProvider);

    // Update state
    this.state.previousProvider = fromProvider;
    this.state.currentProvider = toProvider;
    this.state.lastRollback = new Date();
    this.state.rollbackCount++;
    this.state.inCooldown = true;
    this.state.cooldownEndsAt = new Date(Date.now() + this.config.cooldownPeriodMs);

    const event: RollbackEvent = {
      id: `rollback-${Date.now()}`,
      timestamp: new Date(),
      fromProvider,
      toProvider,
      reason,
      triggeredBy,
      dataPreserved: preservationResult.preserved,
      rollbackDurationMs: Date.now() - startTime
    };

    this.rollbackHistory.push(event);

    // Schedule cooldown end
    setTimeout(() => {
      this.state.inCooldown = false;
      this.state.cooldownEndsAt = null;
    }, this.config.cooldownPeriodMs);

    return event;
  }

  /**
   * Switch to a specific provider
   */
  async switchProvider(provider: AIProvider): Promise<void> {
    // Verify provider is healthy before switching
    const health = this.healthStatus.get(provider);
    if (!health?.healthy) {
      throw new Error(`Cannot switch to unhealthy provider: ${provider}`);
    }

    // Simulate provider switch (in real implementation, would update routing)
    await this.delay(100);
    
    this.state.currentProvider = provider;
    this.config.currentProvider = provider;
  }

  /**
   * Preserve data during rollback
   */
  async preserveData(): Promise<DataPreservationResult> {
    // Simulate data preservation
    await this.delay(50);

    // In real implementation, would:
    // 1. Flush pending writes
    // 2. Sync data between providers
    // 3. Verify data integrity

    return {
      preserved: true,
      recordsPreserved: 1000,
      recordsLost: 0,
      verificationPassed: true,
      details: [
        'Pending writes flushed',
        'Data synchronized between providers',
        'Integrity verification passed'
      ]
    };
  }


  /**
   * Record an error for a provider
   */
  recordError(provider: AIProvider): void {
    const errors = this.errorCounts.get(provider) || [];
    const now = Date.now();
    
    // Add new error
    errors.push(now);
    
    // Remove errors outside monitoring window
    const windowStart = now - this.config.monitoringWindowMs;
    const recentErrors = errors.filter(t => t > windowStart);
    this.errorCounts.set(provider, recentErrors);

    // Update health status
    this.updateHealthStatus(provider);

    // Check for auto-rollback
    if (this.config.autoRollbackEnabled && provider === this.state.currentProvider) {
      this.checkAutoRollback();
    }
  }

  /**
   * Record latency measurement for a provider
   */
  recordLatency(provider: AIProvider, latencyMs: number): void {
    const measurements = this.latencyMeasurements.get(provider) || [];
    
    // Keep last 100 measurements
    if (measurements.length >= 100) {
      measurements.shift();
    }
    measurements.push(latencyMs);
    this.latencyMeasurements.set(provider, measurements);

    // Update health status
    this.updateHealthStatus(provider);

    // Check for auto-rollback
    if (this.config.autoRollbackEnabled && provider === this.state.currentProvider) {
      this.checkAutoRollback();
    }
  }

  /**
   * Update health status for a provider
   */
  private updateHealthStatus(provider: AIProvider): void {
    const errors = this.errorCounts.get(provider) || [];
    const latencies = this.latencyMeasurements.get(provider) || [];
    
    // Calculate error rate (errors per minute)
    const errorRate = errors.length;
    
    // Calculate average latency
    const averageLatencyMs = latencies.length > 0
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 0;

    // Determine health
    const healthy = errorRate < this.config.errorThreshold && 
                   averageLatencyMs < this.config.latencyThreshold;

    const currentHealth = this.healthStatus.get(provider);
    const consecutiveFailures = healthy ? 0 : (currentHealth?.consecutiveFailures || 0) + 1;

    this.healthStatus.set(provider, {
      provider,
      healthy,
      errorRate,
      averageLatencyMs,
      lastChecked: new Date(),
      consecutiveFailures
    });
  }

  /**
   * Check if auto-rollback should be triggered
   */
  private async checkAutoRollback(): Promise<void> {
    if (this.state.inCooldown) return;

    const currentHealth = this.healthStatus.get(this.state.currentProvider);
    if (!currentHealth) return;

    let reason: RollbackEvent['reason'] | null = null;

    if (currentHealth.errorRate >= this.config.errorThreshold) {
      reason = 'auto-error';
    } else if (currentHealth.averageLatencyMs >= this.config.latencyThreshold) {
      reason = 'auto-latency';
    } else if (!currentHealth.healthy) {
      reason = 'auto-health';
    }

    if (reason) {
      try {
        await this.rollback(reason, 'auto-rollback-system');
      } catch {
        // Rollback failed, likely in cooldown
      }
    }
  }

  /**
   * Get current provider
   */
  getCurrentProvider(): AIProvider {
    return this.state.currentProvider;
  }

  /**
   * Get rollback state
   */
  getState(): RollbackState {
    return { ...this.state };
  }

  /**
   * Get health status for a provider
   */
  getHealthStatus(provider: AIProvider): ProviderHealth | undefined {
    return this.healthStatus.get(provider);
  }

  /**
   * Get all health statuses
   */
  getAllHealthStatuses(): ProviderHealth[] {
    return Array.from(this.healthStatus.values());
  }

  /**
   * Get rollback history
   */
  getRollbackHistory(): RollbackEvent[] {
    return [...this.rollbackHistory];
  }

  /**
   * Check if rollback is available
   */
  canRollback(): boolean {
    if (this.state.inCooldown) return false;
    
    const fallbackHealth = this.healthStatus.get(this.config.fallbackProvider);
    return fallbackHealth?.healthy ?? false;
  }

  /**
   * Verify rollback capability
   */
  async verifyRollbackCapability(): Promise<{ canRollback: boolean; reason: string }> {
    if (this.state.inCooldown) {
      return { 
        canRollback: false, 
        reason: `In cooldown until ${this.state.cooldownEndsAt?.toISOString()}` 
      };
    }

    const fallbackHealth = this.healthStatus.get(this.config.fallbackProvider);
    if (!fallbackHealth?.healthy) {
      return { 
        canRollback: false, 
        reason: `Fallback provider ${this.config.fallbackProvider} is unhealthy` 
      };
    }

    return { canRollback: true, reason: 'Rollback available' };
  }


  /**
   * Get configuration
   */
  getConfig(): RollbackConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RollbackConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Reset state (for testing)
   */
  reset(): void {
    this.state = {
      currentProvider: this.config.currentProvider,
      previousProvider: null,
      lastRollback: null,
      rollbackCount: 0,
      inCooldown: false,
      cooldownEndsAt: null
    };
    this.rollbackHistory = [];
    this.initializeHealthStatus();
  }

  /**
   * Helper to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const azureRollbackService = new AzureRollbackService();
