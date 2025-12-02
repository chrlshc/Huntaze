/**
 * Azure OpenAI Auto-scaling Service
 * Manages provisioned throughput units (PTU) and auto-scaling rules
 * 
 * Feature: huntaze-ai-azure-migration
 * Task 43: Configure Azure OpenAI auto-scaling
 * Validates: Requirements 12.1, 12.2, 12.3
 */

export interface PTUConfiguration {
  deploymentName: string;
  basePTU: number;
  minPTU: number;
  maxPTU: number;
  scaleUpThreshold: number; // Utilization % to trigger scale up
  scaleDownThreshold: number; // Utilization % to trigger scale down
  cooldownPeriodMs: number;
  guaranteedLatencyMs: number;
}

export interface ScalingRule {
  id: string;
  deploymentName: string;
  metricName: 'utilization' | 'latency' | 'queue_depth' | 'error_rate';
  operator: 'gt' | 'lt' | 'gte' | 'lte';
  threshold: number;
  action: 'scale_up' | 'scale_down';
  adjustment: number; // PTU adjustment
  cooldownMs: number;
}

export interface CapacityMetrics {
  deploymentName: string;
  currentPTU: number;
  utilization: number;
  averageLatencyMs: number;
  queueDepth: number;
  errorRate: number;
  timestamp: Date;
}

export interface ScalingEvent {
  id: string;
  deploymentName: string;
  previousPTU: number;
  newPTU: number;
  reason: string;
  triggeredBy: string;
  timestamp: Date;
}

export interface CapacityAlert {
  id: string;
  deploymentName: string;
  alertType: 'high_utilization' | 'latency_breach' | 'capacity_limit' | 'scale_failure';
  severity: 'warning' | 'critical';
  message: string;
  timestamp: Date;
}

/**
 * Azure OpenAI Auto-scaling Service
 * Manages PTU allocation and auto-scaling based on traffic patterns
 */
export class AzureAutoScalingService {
  private configurations: Map<string, PTUConfiguration> = new Map();
  private scalingRules: Map<string, ScalingRule[]> = new Map();
  private currentCapacity: Map<string, number> = new Map();
  private lastScaleTime: Map<string, Date> = new Map();
  private metricsHistory: Map<string, CapacityMetrics[]> = new Map();
  private scalingEvents: ScalingEvent[] = [];
  private alerts: CapacityAlert[] = [];


  constructor() {
    // Initialize with default configurations
    this.initializeDefaultConfigurations();
  }

  /**
   * Initialize default PTU configurations for deployments
   */
  private initializeDefaultConfigurations(): void {
    const defaultConfigs: PTUConfiguration[] = [
      {
        deploymentName: 'gpt-4-turbo-prod',
        basePTU: 100,
        minPTU: 50,
        maxPTU: 500,
        scaleUpThreshold: 80,
        scaleDownThreshold: 30,
        cooldownPeriodMs: 300000, // 5 minutes
        guaranteedLatencyMs: 500,
      },
      {
        deploymentName: 'gpt-4-standard-prod',
        basePTU: 80,
        minPTU: 40,
        maxPTU: 400,
        scaleUpThreshold: 75,
        scaleDownThreshold: 25,
        cooldownPeriodMs: 300000,
        guaranteedLatencyMs: 750,
      },
      {
        deploymentName: 'gpt-35-turbo-prod',
        basePTU: 150,
        minPTU: 75,
        maxPTU: 600,
        scaleUpThreshold: 85,
        scaleDownThreshold: 35,
        cooldownPeriodMs: 180000, // 3 minutes
        guaranteedLatencyMs: 300,
      },
    ];

    for (const config of defaultConfigs) {
      this.configurations.set(config.deploymentName, config);
      this.currentCapacity.set(config.deploymentName, config.basePTU);
      this.metricsHistory.set(config.deploymentName, []);
    }
  }

  /**
   * Configure PTU for a deployment
   * Validates: Requirements 12.1
   */
  configurePTU(config: PTUConfiguration): void {
    // Validate configuration
    if (config.minPTU > config.maxPTU) {
      throw new Error('minPTU cannot be greater than maxPTU');
    }
    if (config.basePTU < config.minPTU || config.basePTU > config.maxPTU) {
      throw new Error('basePTU must be between minPTU and maxPTU');
    }
    if (config.scaleUpThreshold <= config.scaleDownThreshold) {
      throw new Error('scaleUpThreshold must be greater than scaleDownThreshold');
    }

    this.configurations.set(config.deploymentName, config);
    
    // Initialize capacity if not set
    if (!this.currentCapacity.has(config.deploymentName)) {
      this.currentCapacity.set(config.deploymentName, config.basePTU);
    }
    
    if (!this.metricsHistory.has(config.deploymentName)) {
      this.metricsHistory.set(config.deploymentName, []);
    }
  }

  /**
   * Add auto-scaling rule
   * Validates: Requirements 12.2
   */
  addScalingRule(rule: ScalingRule): void {
    const rules = this.scalingRules.get(rule.deploymentName) || [];
    
    // Check for duplicate rule
    const existingIndex = rules.findIndex(r => r.id === rule.id);
    if (existingIndex >= 0) {
      rules[existingIndex] = rule;
    } else {
      rules.push(rule);
    }
    
    this.scalingRules.set(rule.deploymentName, rules);
  }

  /**
   * Remove scaling rule
   */
  removeScalingRule(deploymentName: string, ruleId: string): boolean {
    const rules = this.scalingRules.get(deploymentName);
    if (!rules) return false;

    const index = rules.findIndex(r => r.id === ruleId);
    if (index >= 0) {
      rules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Record capacity metrics and evaluate scaling rules
   * Validates: Requirements 12.2, 12.3
   */
  recordMetrics(metrics: CapacityMetrics): ScalingEvent | null {
    // Store metrics in history
    const history = this.metricsHistory.get(metrics.deploymentName) || [];
    history.push(metrics);
    
    // Keep only last 100 metrics
    if (history.length > 100) {
      history.shift();
    }
    this.metricsHistory.set(metrics.deploymentName, history);

    // Check for alerts
    this.checkAlerts(metrics);

    // Evaluate scaling rules
    return this.evaluateScaling(metrics);
  }

  /**
   * Evaluate scaling rules and trigger scaling if needed
   */
  private evaluateScaling(metrics: CapacityMetrics): ScalingEvent | null {
    const config = this.configurations.get(metrics.deploymentName);
    if (!config) return null;

    const currentPTU = this.currentCapacity.get(metrics.deploymentName) || config.basePTU;
    
    // Check cooldown period
    const lastScale = this.lastScaleTime.get(metrics.deploymentName);
    if (lastScale && Date.now() - lastScale.getTime() < config.cooldownPeriodMs) {
      return null;
    }

    // Check custom scaling rules first
    const rules = this.scalingRules.get(metrics.deploymentName) || [];
    for (const rule of rules) {
      if (this.evaluateRule(rule, metrics)) {
        const newPTU = this.calculateNewPTU(currentPTU, rule.action, rule.adjustment, config);
        if (newPTU !== currentPTU) {
          return this.executeScaling(metrics.deploymentName, currentPTU, newPTU, `Rule: ${rule.id}`);
        }
      }
    }

    // Check default threshold-based scaling
    if (metrics.utilization >= config.scaleUpThreshold && currentPTU < config.maxPTU) {
      const adjustment = Math.ceil(currentPTU * 0.25); // Scale up by 25%
      const newPTU = Math.min(currentPTU + adjustment, config.maxPTU);
      return this.executeScaling(metrics.deploymentName, currentPTU, newPTU, 'High utilization');
    }

    if (metrics.utilization <= config.scaleDownThreshold && currentPTU > config.minPTU) {
      const adjustment = Math.ceil(currentPTU * 0.2); // Scale down by 20%
      const newPTU = Math.max(currentPTU - adjustment, config.minPTU);
      return this.executeScaling(metrics.deploymentName, currentPTU, newPTU, 'Low utilization');
    }

    return null;
  }


  /**
   * Evaluate a single scaling rule against metrics
   */
  private evaluateRule(rule: ScalingRule, metrics: CapacityMetrics): boolean {
    let metricValue: number;
    
    switch (rule.metricName) {
      case 'utilization':
        metricValue = metrics.utilization;
        break;
      case 'latency':
        metricValue = metrics.averageLatencyMs;
        break;
      case 'queue_depth':
        metricValue = metrics.queueDepth;
        break;
      case 'error_rate':
        metricValue = metrics.errorRate;
        break;
      default:
        return false;
    }

    switch (rule.operator) {
      case 'gt':
        return metricValue > rule.threshold;
      case 'lt':
        return metricValue < rule.threshold;
      case 'gte':
        return metricValue >= rule.threshold;
      case 'lte':
        return metricValue <= rule.threshold;
      default:
        return false;
    }
  }

  /**
   * Calculate new PTU value based on action and adjustment
   */
  private calculateNewPTU(
    currentPTU: number,
    action: 'scale_up' | 'scale_down',
    adjustment: number,
    config: PTUConfiguration
  ): number {
    let newPTU: number;
    
    if (action === 'scale_up') {
      newPTU = currentPTU + adjustment;
      return Math.min(newPTU, config.maxPTU);
    } else {
      newPTU = currentPTU - adjustment;
      return Math.max(newPTU, config.minPTU);
    }
  }

  /**
   * Execute scaling operation
   */
  private executeScaling(
    deploymentName: string,
    previousPTU: number,
    newPTU: number,
    reason: string
  ): ScalingEvent {
    const event: ScalingEvent = {
      id: `scale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      deploymentName,
      previousPTU,
      newPTU,
      reason,
      triggeredBy: 'auto-scaling',
      timestamp: new Date(),
    };

    // Update capacity
    this.currentCapacity.set(deploymentName, newPTU);
    this.lastScaleTime.set(deploymentName, new Date());
    
    // Store event
    this.scalingEvents.push(event);
    
    // Keep only last 1000 events
    if (this.scalingEvents.length > 1000) {
      this.scalingEvents.shift();
    }

    return event;
  }

  /**
   * Check for capacity alerts
   */
  private checkAlerts(metrics: CapacityMetrics): void {
    const config = this.configurations.get(metrics.deploymentName);
    if (!config) return;

    const currentPTU = this.currentCapacity.get(metrics.deploymentName) || config.basePTU;

    // High utilization alert
    if (metrics.utilization >= 90) {
      this.addAlert({
        id: `alert-${Date.now()}`,
        deploymentName: metrics.deploymentName,
        alertType: 'high_utilization',
        severity: metrics.utilization >= 95 ? 'critical' : 'warning',
        message: `Utilization at ${metrics.utilization}% for ${metrics.deploymentName}`,
        timestamp: new Date(),
      });
    }

    // Latency breach alert
    if (metrics.averageLatencyMs > config.guaranteedLatencyMs) {
      this.addAlert({
        id: `alert-${Date.now()}`,
        deploymentName: metrics.deploymentName,
        alertType: 'latency_breach',
        severity: metrics.averageLatencyMs > config.guaranteedLatencyMs * 2 ? 'critical' : 'warning',
        message: `Latency ${metrics.averageLatencyMs}ms exceeds threshold ${config.guaranteedLatencyMs}ms`,
        timestamp: new Date(),
      });
    }

    // Capacity limit alert
    if (currentPTU >= config.maxPTU && metrics.utilization >= config.scaleUpThreshold) {
      this.addAlert({
        id: `alert-${Date.now()}`,
        deploymentName: metrics.deploymentName,
        alertType: 'capacity_limit',
        severity: 'critical',
        message: `At maximum capacity (${config.maxPTU} PTU) with high utilization`,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Add alert to the list
   */
  private addAlert(alert: CapacityAlert): void {
    this.alerts.push(alert);
    
    // Keep only last 500 alerts
    if (this.alerts.length > 500) {
      this.alerts.shift();
    }
  }

  /**
   * Get current capacity for a deployment
   */
  getCurrentCapacity(deploymentName: string): number | undefined {
    return this.currentCapacity.get(deploymentName);
  }

  /**
   * Get configuration for a deployment
   */
  getConfiguration(deploymentName: string): PTUConfiguration | undefined {
    return this.configurations.get(deploymentName);
  }

  /**
   * Get all configurations
   */
  getAllConfigurations(): PTUConfiguration[] {
    return Array.from(this.configurations.values());
  }

  /**
   * Get scaling rules for a deployment
   */
  getScalingRules(deploymentName: string): ScalingRule[] {
    return this.scalingRules.get(deploymentName) || [];
  }

  /**
   * Get metrics history for a deployment
   */
  getMetricsHistory(deploymentName: string, limit: number = 50): CapacityMetrics[] {
    const history = this.metricsHistory.get(deploymentName) || [];
    return history.slice(-limit);
  }

  /**
   * Get recent scaling events
   */
  getScalingEvents(limit: number = 50): ScalingEvent[] {
    return this.scalingEvents.slice(-limit);
  }

  /**
   * Get scaling events for a specific deployment
   */
  getDeploymentScalingEvents(deploymentName: string, limit: number = 50): ScalingEvent[] {
    return this.scalingEvents
      .filter(e => e.deploymentName === deploymentName)
      .slice(-limit);
  }

  /**
   * Get recent alerts
   */
  getAlerts(limit: number = 50): CapacityAlert[] {
    return this.alerts.slice(-limit);
  }

  /**
   * Get alerts for a specific deployment
   */
  getDeploymentAlerts(deploymentName: string, limit: number = 50): CapacityAlert[] {
    return this.alerts
      .filter(a => a.deploymentName === deploymentName)
      .slice(-limit);
  }

  /**
   * Clear alerts for a deployment
   */
  clearAlerts(deploymentName?: string): void {
    if (deploymentName) {
      this.alerts = this.alerts.filter(a => a.deploymentName !== deploymentName);
    } else {
      this.alerts = [];
    }
  }

  /**
   * Manual scale operation
   */
  manualScale(deploymentName: string, newPTU: number, reason: string = 'Manual scaling'): ScalingEvent | null {
    const config = this.configurations.get(deploymentName);
    if (!config) {
      throw new Error(`No configuration found for deployment: ${deploymentName}`);
    }

    // Validate new PTU
    if (newPTU < config.minPTU || newPTU > config.maxPTU) {
      throw new Error(`PTU must be between ${config.minPTU} and ${config.maxPTU}`);
    }

    const currentPTU = this.currentCapacity.get(deploymentName) || config.basePTU;
    
    if (newPTU === currentPTU) {
      return null;
    }

    const event: ScalingEvent = {
      id: `scale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      deploymentName,
      previousPTU: currentPTU,
      newPTU,
      reason,
      triggeredBy: 'manual',
      timestamp: new Date(),
    };

    this.currentCapacity.set(deploymentName, newPTU);
    this.scalingEvents.push(event);

    return event;
  }

  /**
   * Get capacity utilization summary
   */
  getCapacitySummary(): Record<string, {
    currentPTU: number;
    minPTU: number;
    maxPTU: number;
    utilizationPercent: number;
    lastMetrics: CapacityMetrics | null;
  }> {
    const summary: Record<string, any> = {};

    for (const [deploymentName, config] of this.configurations) {
      const currentPTU = this.currentCapacity.get(deploymentName) || config.basePTU;
      const history = this.metricsHistory.get(deploymentName) || [];
      const lastMetrics = history.length > 0 ? history[history.length - 1] : null;

      summary[deploymentName] = {
        currentPTU,
        minPTU: config.minPTU,
        maxPTU: config.maxPTU,
        utilizationPercent: lastMetrics?.utilization || 0,
        lastMetrics,
      };
    }

    return summary;
  }

  /**
   * Predict scaling needs based on historical data
   * Validates: Requirements 12.3
   */
  predictScalingNeeds(deploymentName: string, hoursAhead: number = 1): {
    predictedUtilization: number;
    recommendedPTU: number;
    confidence: number;
  } | null {
    const history = this.metricsHistory.get(deploymentName);
    const config = this.configurations.get(deploymentName);
    
    if (!history || history.length < 10 || !config) {
      return null;
    }

    // Simple moving average prediction
    const recentMetrics = history.slice(-20);
    const avgUtilization = recentMetrics.reduce((sum, m) => sum + m.utilization, 0) / recentMetrics.length;
    
    // Calculate trend
    const firstHalf = recentMetrics.slice(0, 10);
    const secondHalf = recentMetrics.slice(-10);
    const firstAvg = firstHalf.reduce((sum, m) => sum + m.utilization, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, m) => sum + m.utilization, 0) / secondHalf.length;
    const trend = secondAvg - firstAvg;

    // Predict future utilization
    const predictedUtilization = Math.max(0, Math.min(100, avgUtilization + (trend * hoursAhead)));
    
    // Calculate recommended PTU
    const currentPTU = this.currentCapacity.get(deploymentName) || config.basePTU;
    let recommendedPTU = currentPTU;

    if (predictedUtilization >= config.scaleUpThreshold) {
      recommendedPTU = Math.min(
        Math.ceil(currentPTU * (1 + (predictedUtilization - config.scaleUpThreshold) / 100)),
        config.maxPTU
      );
    } else if (predictedUtilization <= config.scaleDownThreshold) {
      recommendedPTU = Math.max(
        Math.floor(currentPTU * (1 - (config.scaleDownThreshold - predictedUtilization) / 100)),
        config.minPTU
      );
    }

    // Calculate confidence based on data consistency
    const variance = recentMetrics.reduce((sum, m) => sum + Math.pow(m.utilization - avgUtilization, 2), 0) / recentMetrics.length;
    const stdDev = Math.sqrt(variance);
    const confidence = Math.max(0.3, Math.min(0.95, 1 - (stdDev / 50)));

    return {
      predictedUtilization,
      recommendedPTU,
      confidence,
    };
  }
}

// Export singleton instance
export const azureAutoScalingService = new AzureAutoScalingService();
