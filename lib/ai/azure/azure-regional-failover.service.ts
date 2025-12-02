/**
 * Azure Regional Failover Service
 * Manages automatic failover between Azure regions
 * 
 * Feature: huntaze-ai-azure-migration
 * Task 45: Implement regional failover
 * Validates: Requirements 12.5
 */

export interface RegionConfig {
  id: string;
  name: string;
  endpoint: string;
  priority: number; // Lower = higher priority
  healthy: boolean;
  lastHealthCheck: Date;
  consecutiveFailures: number;
  latencyMs: number;
  isActive: boolean;
}

export interface FailoverEvent {
  id: string;
  fromRegion: string;
  toRegion: string;
  reason: string;
  timestamp: Date;
  automatic: boolean;
  duration?: number; // Time until failback
}

export interface FailoverConfig {
  healthCheckIntervalMs: number;
  healthCheckTimeoutMs: number;
  failoverThreshold: number; // Consecutive failures to trigger failover
  failbackThreshold: number; // Consecutive successes to trigger failback
  failbackDelayMs: number; // Minimum time before failback
  enableAutoFailback: boolean;
}

export interface RegionHealth {
  regionId: string;
  healthy: boolean;
  latencyMs: number;
  errorRate: number;
  lastCheck: Date;
}

/**
 * Azure Regional Failover Service
 * Implements automatic failover and failback between Azure regions
 */
export class AzureRegionalFailoverService {
  private regions: Map<string, RegionConfig> = new Map();
  private config: FailoverConfig;
  private activeRegion: string;
  private failoverEvents: FailoverEvent[] = [];
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private lastFailoverTime: Date | null = null;
  private healthHistory: Map<string, RegionHealth[]> = new Map();


  constructor(config?: Partial<FailoverConfig>) {
    this.config = {
      healthCheckIntervalMs: config?.healthCheckIntervalMs || 30000, // 30 seconds
      healthCheckTimeoutMs: config?.healthCheckTimeoutMs || 5000,
      failoverThreshold: config?.failoverThreshold || 3,
      failbackThreshold: config?.failbackThreshold || 5,
      failbackDelayMs: config?.failbackDelayMs || 300000, // 5 minutes
      enableAutoFailback: config?.enableAutoFailback ?? true,
    };

    // Initialize default regions
    this.initializeDefaultRegions();
    this.activeRegion = 'westeurope'; // Primary region
  }

  /**
   * Initialize default Azure regions
   */
  private initializeDefaultRegions(): void {
    const defaultRegions: Omit<RegionConfig, 'lastHealthCheck'>[] = [
      {
        id: 'westeurope',
        name: 'West Europe',
        endpoint: 'https://huntaze-ai-westeurope.openai.azure.com',
        priority: 1,
        healthy: true,
        consecutiveFailures: 0,
        latencyMs: 0,
        isActive: true,
      },
      {
        id: 'northeurope',
        name: 'North Europe',
        endpoint: 'https://huntaze-ai-northeurope.openai.azure.com',
        priority: 2,
        healthy: true,
        consecutiveFailures: 0,
        latencyMs: 0,
        isActive: false,
      },
      {
        id: 'francecentral',
        name: 'France Central',
        endpoint: 'https://huntaze-ai-francecentral.openai.azure.com',
        priority: 3,
        healthy: true,
        consecutiveFailures: 0,
        latencyMs: 0,
        isActive: false,
      },
    ];

    for (const region of defaultRegions) {
      this.regions.set(region.id, {
        ...region,
        lastHealthCheck: new Date(),
      });
      this.healthHistory.set(region.id, []);
    }
  }

  /**
   * Register a new region
   */
  registerRegion(region: Omit<RegionConfig, 'lastHealthCheck' | 'consecutiveFailures' | 'latencyMs' | 'isActive'>): void {
    this.regions.set(region.id, {
      ...region,
      lastHealthCheck: new Date(),
      consecutiveFailures: 0,
      latencyMs: 0,
      isActive: false,
    });
    this.healthHistory.set(region.id, []);
  }

  /**
   * Get the current active region
   */
  getActiveRegion(): RegionConfig | undefined {
    return this.regions.get(this.activeRegion);
  }

  /**
   * Get active region endpoint
   */
  getActiveEndpoint(): string {
    const region = this.regions.get(this.activeRegion);
    return region?.endpoint || '';
  }

  /**
   * Record health check result
   * Validates: Requirements 12.5
   */
  recordHealthCheck(regionId: string, healthy: boolean, latencyMs: number, errorRate: number = 0): FailoverEvent | null {
    const region = this.regions.get(regionId);
    if (!region) return null;

    // Update region health
    region.lastHealthCheck = new Date();
    region.latencyMs = region.latencyMs * 0.7 + latencyMs * 0.3; // EMA

    // Store health history
    const history = this.healthHistory.get(regionId) || [];
    history.push({
      regionId,
      healthy,
      latencyMs,
      errorRate,
      lastCheck: new Date(),
    });
    
    // Keep only last 100 entries
    if (history.length > 100) {
      history.shift();
    }
    this.healthHistory.set(regionId, history);

    if (healthy) {
      region.consecutiveFailures = 0;
      
      // Check for failback if this is the primary region
      if (!region.isActive && region.priority < this.getPrimaryRegionPriority()) {
        return this.checkFailback(regionId);
      }
    } else {
      region.consecutiveFailures++;
      
      // Check for failover if this is the active region
      if (region.isActive && region.consecutiveFailures >= this.config.failoverThreshold) {
        region.healthy = false;
        return this.triggerFailover(regionId, 'Health check failures exceeded threshold');
      }
    }

    return null;
  }

  /**
   * Get priority of current primary (active) region
   */
  private getPrimaryRegionPriority(): number {
    const activeRegion = this.regions.get(this.activeRegion);
    return activeRegion?.priority || Infinity;
  }

  /**
   * Check if failback should occur
   */
  private checkFailback(regionId: string): FailoverEvent | null {
    if (!this.config.enableAutoFailback) return null;

    const region = this.regions.get(regionId);
    if (!region) return null;

    // Check failback delay
    if (this.lastFailoverTime) {
      const timeSinceFailover = Date.now() - this.lastFailoverTime.getTime();
      if (timeSinceFailover < this.config.failbackDelayMs) {
        return null;
      }
    }

    // Check if region has been consistently healthy
    const history = this.healthHistory.get(regionId) || [];
    const recentChecks = history.slice(-this.config.failbackThreshold);
    
    if (recentChecks.length < this.config.failbackThreshold) {
      return null;
    }

    const allHealthy = recentChecks.every(h => h.healthy);
    if (!allHealthy) {
      return null;
    }

    // Trigger failback
    return this.triggerFailback(regionId);
  }

  /**
   * Trigger failover to next available region
   * Validates: Requirements 12.5
   */
  triggerFailover(fromRegionId: string, reason: string): FailoverEvent | null {
    const fromRegion = this.regions.get(fromRegionId);
    if (!fromRegion) return null;

    // Find next healthy region by priority
    const healthyRegions = Array.from(this.regions.values())
      .filter(r => r.id !== fromRegionId && r.healthy)
      .sort((a, b) => a.priority - b.priority);

    if (healthyRegions.length === 0) {
      // No healthy regions available
      return null;
    }

    const toRegion = healthyRegions[0];

    // Update region states
    fromRegion.isActive = false;
    toRegion.isActive = true;
    this.activeRegion = toRegion.id;
    this.lastFailoverTime = new Date();

    // Create failover event
    const event: FailoverEvent = {
      id: `failover-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fromRegion: fromRegionId,
      toRegion: toRegion.id,
      reason,
      timestamp: new Date(),
      automatic: true,
    };

    this.failoverEvents.push(event);

    // Keep only last 100 events
    if (this.failoverEvents.length > 100) {
      this.failoverEvents.shift();
    }

    return event;
  }

  /**
   * Trigger failback to a higher priority region
   */
  private triggerFailback(toRegionId: string): FailoverEvent | null {
    const toRegion = this.regions.get(toRegionId);
    const fromRegion = this.regions.get(this.activeRegion);
    
    if (!toRegion || !fromRegion) return null;

    // Update region states
    fromRegion.isActive = false;
    toRegion.isActive = true;
    toRegion.healthy = true;
    this.activeRegion = toRegionId;

    // Create failback event
    const event: FailoverEvent = {
      id: `failback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fromRegion: fromRegion.id,
      toRegion: toRegionId,
      reason: 'Primary region recovered',
      timestamp: new Date(),
      automatic: true,
    };

    this.failoverEvents.push(event);

    return event;
  }


  /**
   * Manual failover to a specific region
   */
  manualFailover(toRegionId: string, reason: string = 'Manual failover'): FailoverEvent | null {
    const toRegion = this.regions.get(toRegionId);
    const fromRegion = this.regions.get(this.activeRegion);
    
    if (!toRegion || !fromRegion) return null;
    if (toRegionId === this.activeRegion) return null;

    // Update region states
    fromRegion.isActive = false;
    toRegion.isActive = true;
    this.activeRegion = toRegionId;
    this.lastFailoverTime = new Date();

    // Create failover event
    const event: FailoverEvent = {
      id: `failover-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fromRegion: fromRegion.id,
      toRegion: toRegionId,
      reason,
      timestamp: new Date(),
      automatic: false,
    };

    this.failoverEvents.push(event);

    return event;
  }

  /**
   * Start periodic health monitoring
   */
  startHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      return;
    }

    this.healthCheckInterval = setInterval(async () => {
      for (const region of this.regions.values()) {
        await this.performHealthCheck(region.id);
      }
    }, this.config.healthCheckIntervalMs);
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Perform health check on a region
   */
  async performHealthCheck(regionId: string): Promise<boolean> {
    const region = this.regions.get(regionId);
    if (!region) return false;

    try {
      const startTime = Date.now();
      
      // Simulate health check (in production, this would call the actual endpoint)
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Health check timeout'));
        }, this.config.healthCheckTimeoutMs);

        // Simulate health check with random latency
        setTimeout(() => {
          clearTimeout(timeout);
          resolve();
        }, Math.random() * 200);
      });

      const latency = Date.now() - startTime;
      this.recordHealthCheck(regionId, true, latency);
      return true;
    } catch {
      this.recordHealthCheck(regionId, false, this.config.healthCheckTimeoutMs);
      return false;
    }
  }

  /**
   * Get all regions
   */
  getAllRegions(): RegionConfig[] {
    return Array.from(this.regions.values());
  }

  /**
   * Get region by ID
   */
  getRegion(regionId: string): RegionConfig | undefined {
    return this.regions.get(regionId);
  }

  /**
   * Get healthy regions
   */
  getHealthyRegions(): RegionConfig[] {
    return Array.from(this.regions.values()).filter(r => r.healthy);
  }

  /**
   * Get failover events
   */
  getFailoverEvents(limit: number = 50): FailoverEvent[] {
    return this.failoverEvents.slice(-limit);
  }

  /**
   * Get health history for a region
   */
  getHealthHistory(regionId: string, limit: number = 50): RegionHealth[] {
    const history = this.healthHistory.get(regionId) || [];
    return history.slice(-limit);
  }

  /**
   * Get region status summary
   */
  getStatusSummary(): {
    activeRegion: string;
    regions: Array<{
      id: string;
      name: string;
      healthy: boolean;
      isActive: boolean;
      latencyMs: number;
      priority: number;
    }>;
    lastFailover: FailoverEvent | null;
  } {
    const regions = Array.from(this.regions.values()).map(r => ({
      id: r.id,
      name: r.name,
      healthy: r.healthy,
      isActive: r.isActive,
      latencyMs: r.latencyMs,
      priority: r.priority,
    }));

    return {
      activeRegion: this.activeRegion,
      regions,
      lastFailover: this.failoverEvents.length > 0 
        ? this.failoverEvents[this.failoverEvents.length - 1] 
        : null,
    };
  }

  /**
   * Update region priority
   */
  updatePriority(regionId: string, priority: number): void {
    const region = this.regions.get(regionId);
    if (region) {
      region.priority = priority;
    }
  }

  /**
   * Mark region as healthy
   */
  markHealthy(regionId: string): void {
    const region = this.regions.get(regionId);
    if (region) {
      region.healthy = true;
      region.consecutiveFailures = 0;
    }
  }

  /**
   * Mark region as unhealthy
   */
  markUnhealthy(regionId: string): void {
    const region = this.regions.get(regionId);
    if (region) {
      region.healthy = false;
    }
  }

  /**
   * Get configuration
   */
  getConfig(): FailoverConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<FailoverConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Calculate availability percentage
   */
  calculateAvailability(regionId: string, periodMs: number = 3600000): number {
    const history = this.healthHistory.get(regionId) || [];
    const cutoff = new Date(Date.now() - periodMs);
    
    const recentHistory = history.filter(h => h.lastCheck >= cutoff);
    if (recentHistory.length === 0) return 100;

    const healthyCount = recentHistory.filter(h => h.healthy).length;
    return (healthyCount / recentHistory.length) * 100;
  }

  /**
   * Get average latency for a region
   */
  getAverageLatency(regionId: string, periodMs: number = 3600000): number {
    const history = this.healthHistory.get(regionId) || [];
    const cutoff = new Date(Date.now() - periodMs);
    
    const recentHistory = history.filter(h => h.lastCheck >= cutoff && h.healthy);
    if (recentHistory.length === 0) return 0;

    const totalLatency = recentHistory.reduce((sum, h) => sum + h.latencyMs, 0);
    return totalLatency / recentHistory.length;
  }

  /**
   * Reset all statistics
   */
  resetStats(): void {
    for (const region of this.regions.values()) {
      region.consecutiveFailures = 0;
      region.latencyMs = 0;
    }
    this.healthHistory.clear();
    for (const regionId of this.regions.keys()) {
      this.healthHistory.set(regionId, []);
    }
  }
}

// Export singleton instance
export const azureRegionalFailoverService = new AzureRegionalFailoverService();
