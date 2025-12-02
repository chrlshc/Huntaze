/**
 * Azure Model Management Service
 * Manages model versioning, A/B testing, and automatic rollback
 * 
 * Implements:
 * - Property 29: Traffic splitting for A/B tests
 * - Property 30: Automatic rollback on underperformance
 * - Model versioning and deployment management
 */

import { createHash } from 'crypto';

// ============================================================================
// Types
// ============================================================================

export interface ModelVersion {
  id: string;
  name: string;
  version: string;
  deployment: string;
  status: ModelStatus;
  createdAt: Date;
  metrics: ModelMetrics;
  config: ModelConfig;
}

export type ModelStatus = 'active' | 'inactive' | 'testing' | 'deprecated' | 'rollback';

export interface ModelMetrics {
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  errorRate: number;
  successRate: number;
  avgTokensPerRequest: number;
  costPerRequest: number;
  requestCount: number;
  lastUpdated: Date;
}

export interface ModelConfig {
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

export interface ABTestConfig {
  id: string;
  name: string;
  controlModel: string;
  treatmentModel: string;
  trafficSplit: number; // 0-100, percentage to treatment
  status: ABTestStatus;
  startDate: Date;
  endDate?: Date;
  metrics: ABTestMetrics;
}

export type ABTestStatus = 'running' | 'paused' | 'completed' | 'cancelled';

export interface ABTestMetrics {
  controlRequests: number;
  treatmentRequests: number;
  controlSuccessRate: number;
  treatmentSuccessRate: number;
  controlAvgLatency: number;
  treatmentAvgLatency: number;
  controlAvgCost: number;
  treatmentAvgCost: number;
  statisticalSignificance?: number;
}

export interface RollbackConfig {
  enabled: boolean;
  errorRateThreshold: number; // Trigger rollback if error rate exceeds this
  latencyThreshold: number; // Trigger rollback if P95 latency exceeds this (ms)
  minRequestsBeforeRollback: number; // Minimum requests before considering rollback
  rollbackCooldown: number; // Cooldown period between rollbacks (ms)
}

export interface TrafficDecision {
  modelId: string;
  deployment: string;
  isControl: boolean;
  abTestId?: string;
}

export interface ModelManagementConfig {
  defaultRollbackConfig: RollbackConfig;
  metricsRetentionDays: number;
  maxVersionsPerModel: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: ModelManagementConfig = {
  defaultRollbackConfig: {
    enabled: true,
    errorRateThreshold: 0.1, // 10% error rate
    latencyThreshold: 5000, // 5 seconds P95
    minRequestsBeforeRollback: 100,
    rollbackCooldown: 300000, // 5 minutes
  },
  metricsRetentionDays: 30,
  maxVersionsPerModel: 10,
};

// ============================================================================
// Azure Model Management Service
// ============================================================================

export class AzureModelManagementService {
  private models: Map<string, ModelVersion> = new Map();
  private abTests: Map<string, ABTestConfig> = new Map();
  private rollbackHistory: Map<string, Date> = new Map();
  private config: ModelManagementConfig;

  constructor(config: Partial<ModelManagementConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ==========================================================================
  // Model Version Management
  // ==========================================================================

  /**
   * Register a new model version
   */
  registerModel(model: Omit<ModelVersion, 'id' | 'createdAt' | 'metrics'>): ModelVersion {
    const id = this.generateModelId(model.name, model.version);
    
    const newModel: ModelVersion = {
      ...model,
      id,
      createdAt: new Date(),
      metrics: this.createEmptyMetrics(),
    };

    this.models.set(id, newModel);
    this.enforceVersionLimit(model.name);

    return newModel;
  }

  /**
   * Get a model by ID
   */
  getModel(modelId: string): ModelVersion | undefined {
    return this.models.get(modelId);
  }

  /**
   * Get all versions of a model
   */
  getModelVersions(modelName: string): ModelVersion[] {
    return Array.from(this.models.values())
      .filter(m => m.name === modelName)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get the active version of a model
   */
  getActiveModel(modelName: string): ModelVersion | undefined {
    return Array.from(this.models.values())
      .find(m => m.name === modelName && m.status === 'active');
  }

  /**
   * Update model status
   */
  updateModelStatus(modelId: string, status: ModelStatus): boolean {
    const model = this.models.get(modelId);
    if (!model) return false;

    // If activating, deactivate other versions
    if (status === 'active') {
      for (const m of this.models.values()) {
        if (m.name === model.name && m.id !== modelId && m.status === 'active') {
          m.status = 'inactive';
        }
      }
    }

    model.status = status;
    return true;
  }

  /**
   * Update model metrics
   */
  updateModelMetrics(modelId: string, metrics: Partial<ModelMetrics>): boolean {
    const model = this.models.get(modelId);
    if (!model) return false;

    model.metrics = {
      ...model.metrics,
      ...metrics,
      lastUpdated: new Date(),
    };

    // Check for automatic rollback
    this.checkForRollback(model);

    return true;
  }

  // ==========================================================================
  // A/B Testing
  // ==========================================================================

  /**
   * Create a new A/B test
   * Property 29: Traffic splitting for A/B tests
   */
  createABTest(config: Omit<ABTestConfig, 'id' | 'status' | 'metrics'>): ABTestConfig {
    const id = this.generateTestId(config.name);

    // Validate traffic split
    if (config.trafficSplit < 0 || config.trafficSplit > 100) {
      throw new Error('Traffic split must be between 0 and 100');
    }

    // Validate models exist
    if (!this.models.has(config.controlModel)) {
      throw new Error(`Control model not found: ${config.controlModel}`);
    }
    if (!this.models.has(config.treatmentModel)) {
      throw new Error(`Treatment model not found: ${config.treatmentModel}`);
    }

    const test: ABTestConfig = {
      ...config,
      id,
      status: 'running',
      metrics: this.createEmptyABMetrics(),
    };

    this.abTests.set(id, test);

    // Update model statuses
    this.updateModelStatus(config.controlModel, 'testing');
    this.updateModelStatus(config.treatmentModel, 'testing');

    return test;
  }

  /**
   * Get traffic decision for a request
   * Property 29: Traffic splitting for A/B tests
   */
  getTrafficDecision(modelName: string, requestId?: string): TrafficDecision {
    // Check for active A/B test
    const activeTest = this.getActiveABTest(modelName);

    if (activeTest) {
      const isControl = this.shouldRouteToControl(activeTest, requestId);
      const modelId = isControl ? activeTest.controlModel : activeTest.treatmentModel;
      const model = this.models.get(modelId)!;

      return {
        modelId,
        deployment: model.deployment,
        isControl,
        abTestId: activeTest.id,
      };
    }

    // No A/B test, use active model
    const activeModel = this.getActiveModel(modelName);
    if (!activeModel) {
      throw new Error(`No active model found for: ${modelName}`);
    }

    return {
      modelId: activeModel.id,
      deployment: activeModel.deployment,
      isControl: true,
    };
  }

  /**
   * Record A/B test result
   */
  recordABTestResult(
    testId: string,
    isControl: boolean,
    success: boolean,
    latency: number,
    cost: number
  ): void {
    const test = this.abTests.get(testId);
    if (!test || test.status !== 'running') return;

    if (isControl) {
      test.metrics.controlRequests++;
      if (success) {
        const prevSuccessCount = test.metrics.controlSuccessRate * (test.metrics.controlRequests - 1);
        test.metrics.controlSuccessRate = (prevSuccessCount + 1) / test.metrics.controlRequests;
      } else {
        const prevSuccessCount = test.metrics.controlSuccessRate * (test.metrics.controlRequests - 1);
        test.metrics.controlSuccessRate = prevSuccessCount / test.metrics.controlRequests;
      }
      // Update running average for latency and cost
      test.metrics.controlAvgLatency = this.updateRunningAverage(
        test.metrics.controlAvgLatency,
        latency,
        test.metrics.controlRequests
      );
      test.metrics.controlAvgCost = this.updateRunningAverage(
        test.metrics.controlAvgCost,
        cost,
        test.metrics.controlRequests
      );
    } else {
      test.metrics.treatmentRequests++;
      if (success) {
        const prevSuccessCount = test.metrics.treatmentSuccessRate * (test.metrics.treatmentRequests - 1);
        test.metrics.treatmentSuccessRate = (prevSuccessCount + 1) / test.metrics.treatmentRequests;
      } else {
        const prevSuccessCount = test.metrics.treatmentSuccessRate * (test.metrics.treatmentRequests - 1);
        test.metrics.treatmentSuccessRate = prevSuccessCount / test.metrics.treatmentRequests;
      }
      test.metrics.treatmentAvgLatency = this.updateRunningAverage(
        test.metrics.treatmentAvgLatency,
        latency,
        test.metrics.treatmentRequests
      );
      test.metrics.treatmentAvgCost = this.updateRunningAverage(
        test.metrics.treatmentAvgCost,
        cost,
        test.metrics.treatmentRequests
      );
    }

    // Calculate statistical significance if enough data
    if (test.metrics.controlRequests >= 100 && test.metrics.treatmentRequests >= 100) {
      test.metrics.statisticalSignificance = this.calculateStatisticalSignificance(test.metrics);
    }
  }

  /**
   * Get A/B test by ID
   */
  getABTest(testId: string): ABTestConfig | undefined {
    return this.abTests.get(testId);
  }

  /**
   * Get active A/B test for a model
   */
  getActiveABTest(modelName: string): ABTestConfig | undefined {
    for (const test of this.abTests.values()) {
      if (test.status !== 'running') continue;
      
      const controlModel = this.models.get(test.controlModel);
      const treatmentModel = this.models.get(test.treatmentModel);
      
      if (controlModel?.name === modelName || treatmentModel?.name === modelName) {
        return test;
      }
    }
    return undefined;
  }

  /**
   * Complete an A/B test
   */
  completeABTest(testId: string, winner: 'control' | 'treatment'): boolean {
    const test = this.abTests.get(testId);
    if (!test) return false;

    test.status = 'completed';
    test.endDate = new Date();

    // Activate winner, deprecate loser
    const winnerId = winner === 'control' ? test.controlModel : test.treatmentModel;
    const loserId = winner === 'control' ? test.treatmentModel : test.controlModel;

    this.updateModelStatus(winnerId, 'active');
    this.updateModelStatus(loserId, 'deprecated');

    return true;
  }

  /**
   * Pause an A/B test
   */
  pauseABTest(testId: string): boolean {
    const test = this.abTests.get(testId);
    if (!test || test.status !== 'running') return false;

    test.status = 'paused';
    return true;
  }

  /**
   * Resume an A/B test
   */
  resumeABTest(testId: string): boolean {
    const test = this.abTests.get(testId);
    if (!test || test.status !== 'paused') return false;

    test.status = 'running';
    return true;
  }

  // ==========================================================================
  // Automatic Rollback
  // ==========================================================================

  /**
   * Check if model should be rolled back
   * Property 30: Automatic rollback on underperformance
   */
  checkForRollback(model: ModelVersion): boolean {
    const rollbackConfig = this.config.defaultRollbackConfig;

    if (!rollbackConfig.enabled) return false;
    if (model.status !== 'active' && model.status !== 'testing') return false;
    if (model.metrics.requestCount < rollbackConfig.minRequestsBeforeRollback) return false;

    // Check cooldown
    const lastRollback = this.rollbackHistory.get(model.name);
    if (lastRollback && Date.now() - lastRollback.getTime() < rollbackConfig.rollbackCooldown) {
      return false;
    }

    // Check error rate threshold
    if (model.metrics.errorRate > rollbackConfig.errorRateThreshold) {
      return this.performRollback(model, 'error_rate');
    }

    // Check latency threshold
    if (model.metrics.latencyP95 > rollbackConfig.latencyThreshold) {
      return this.performRollback(model, 'latency');
    }

    return false;
  }

  /**
   * Perform rollback to previous version
   * Property 30: Automatic rollback on underperformance
   */
  performRollback(model: ModelVersion, reason: 'error_rate' | 'latency'): boolean {
    // Find previous stable version
    const versions = this.getModelVersions(model.name);
    const previousVersion = versions.find(
      v => v.id !== model.id && 
           v.status !== 'deprecated' && 
           v.status !== 'rollback' &&
           v.metrics.errorRate < this.config.defaultRollbackConfig.errorRateThreshold
    );

    if (!previousVersion) {
      console.warn(`No stable version found for rollback: ${model.name}`);
      return false;
    }

    // Perform rollback
    model.status = 'rollback';
    previousVersion.status = 'active';

    // Record rollback
    this.rollbackHistory.set(model.name, new Date());

    console.log(`Rolled back ${model.name} from ${model.version} to ${previousVersion.version} due to ${reason}`);

    return true;
  }

  /**
   * Get rollback history for a model
   */
  getRollbackHistory(modelName: string): Date | undefined {
    return this.rollbackHistory.get(modelName);
  }

  /**
   * Check if model should trigger rollback based on metrics
   */
  shouldRollback(metrics: ModelMetrics, config?: RollbackConfig): boolean {
    const rollbackConfig = config || this.config.defaultRollbackConfig;

    if (!rollbackConfig.enabled) return false;
    if (metrics.requestCount < rollbackConfig.minRequestsBeforeRollback) return false;

    return (
      metrics.errorRate > rollbackConfig.errorRateThreshold ||
      metrics.latencyP95 > rollbackConfig.latencyThreshold
    );
  }

  // ==========================================================================
  // Statistics
  // ==========================================================================

  /**
   * Get all models
   */
  getAllModels(): ModelVersion[] {
    return Array.from(this.models.values());
  }

  /**
   * Get all A/B tests
   */
  getAllABTests(): ABTestConfig[] {
    return Array.from(this.abTests.values());
  }

  /**
   * Get model statistics
   */
  getModelStats(): {
    totalModels: number;
    activeModels: number;
    testingModels: number;
    deprecatedModels: number;
    activeABTests: number;
  } {
    const models = Array.from(this.models.values());
    const tests = Array.from(this.abTests.values());

    return {
      totalModels: models.length,
      activeModels: models.filter(m => m.status === 'active').length,
      testingModels: models.filter(m => m.status === 'testing').length,
      deprecatedModels: models.filter(m => m.status === 'deprecated').length,
      activeABTests: tests.filter(t => t.status === 'running').length,
    };
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private generateModelId(name: string, version: string): string {
    const data = `${name}-${version}-${Date.now()}`;
    return createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  private generateTestId(name: string): string {
    const data = `${name}-${Date.now()}`;
    return createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  private createEmptyMetrics(): ModelMetrics {
    return {
      latencyP50: 0,
      latencyP95: 0,
      latencyP99: 0,
      errorRate: 0,
      successRate: 1,
      avgTokensPerRequest: 0,
      costPerRequest: 0,
      requestCount: 0,
      lastUpdated: new Date(),
    };
  }

  private createEmptyABMetrics(): ABTestMetrics {
    return {
      controlRequests: 0,
      treatmentRequests: 0,
      controlSuccessRate: 0,
      treatmentSuccessRate: 0,
      controlAvgLatency: 0,
      treatmentAvgLatency: 0,
      controlAvgCost: 0,
      treatmentAvgCost: 0,
    };
  }

  private shouldRouteToControl(test: ABTestConfig, requestId?: string): boolean {
    // Use request ID for consistent routing if provided
    if (requestId) {
      const hash = createHash('sha256').update(requestId).digest();
      const value = hash.readUInt8(0);
      return value >= (test.trafficSplit * 2.55); // 0-255 range
    }

    // Random routing
    return Math.random() * 100 >= test.trafficSplit;
  }

  private updateRunningAverage(currentAvg: number, newValue: number, count: number): number {
    return currentAvg + (newValue - currentAvg) / count;
  }

  private calculateStatisticalSignificance(metrics: ABTestMetrics): number {
    // Simplified z-test for proportions
    const p1 = metrics.controlSuccessRate;
    const p2 = metrics.treatmentSuccessRate;
    const n1 = metrics.controlRequests;
    const n2 = metrics.treatmentRequests;

    const pooledP = (p1 * n1 + p2 * n2) / (n1 + n2);
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2));

    if (se === 0) return 0;

    const z = Math.abs(p1 - p2) / se;

    // Convert z-score to approximate p-value (simplified)
    // Using normal distribution approximation
    const pValue = 2 * (1 - this.normalCDF(z));

    return 1 - pValue; // Return confidence level
  }

  private normalCDF(x: number): number {
    // Approximation of normal CDF
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }

  private enforceVersionLimit(modelName: string): void {
    const versions = this.getModelVersions(modelName);
    
    if (versions.length > this.config.maxVersionsPerModel) {
      // Remove oldest deprecated versions first
      const toRemove = versions
        .filter(v => v.status === 'deprecated')
        .slice(this.config.maxVersionsPerModel);

      for (const version of toRemove) {
        this.models.delete(version.id);
      }
    }
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

let instance: AzureModelManagementService | null = null;

export function getAzureModelManagement(): AzureModelManagementService {
  if (!instance) {
    instance = new AzureModelManagementService();
  }
  return instance;
}
