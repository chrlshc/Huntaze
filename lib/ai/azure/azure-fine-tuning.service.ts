/**
 * Azure Fine-Tuning Service
 * Manages creator-specific model fine-tuning with Azure OpenAI
 * 
 * Implements:
 * - Creator-specific data collection
 * - Fine-tuning job creation and management
 * - Fine-tuned model deployment
 * - Performance comparison
 */

import { createHash } from 'crypto';

// ============================================================================
// Types
// ============================================================================

export interface FineTuningJob {
  id: string;
  creatorId: string;
  baseModel: string;
  status: FineTuningStatus;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  trainingFile: string;
  validationFile?: string;
  hyperparameters: FineTuningHyperparameters;
  resultModel?: string;
  metrics?: FineTuningMetrics;
  error?: string;
}

export type FineTuningStatus = 
  | 'pending'
  | 'validating'
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export interface FineTuningHyperparameters {
  nEpochs: number;
  batchSize: number;
  learningRateMultiplier: number;
}

export interface FineTuningMetrics {
  trainingLoss: number;
  validationLoss?: number;
  trainingTokens: number;
  trainedSeconds: number;
}

export interface TrainingExample {
  id: string;
  creatorId: string;
  messages: TrainingMessage[];
  createdAt: Date;
  quality: 'high' | 'medium' | 'low';
  category: string;
}

export interface TrainingMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface FineTunedModel {
  id: string;
  creatorId: string;
  jobId: string;
  baseModel: string;
  deployment: string;
  status: 'deploying' | 'active' | 'inactive' | 'deleted';
  createdAt: Date;
  performance: ModelPerformance;
}

export interface ModelPerformance {
  avgLatency: number;
  avgQualityScore: number;
  requestCount: number;
  costPerRequest: number;
  comparisonToBase: PerformanceComparison;
}

export interface PerformanceComparison {
  latencyImprovement: number; // Percentage
  qualityImprovement: number; // Percentage
  costDifference: number; // Percentage
}

export interface FineTuningConfig {
  minExamplesRequired: number;
  maxExamplesPerJob: number;
  defaultHyperparameters: FineTuningHyperparameters;
  qualityThreshold: number;
  autoDeployOnSuccess: boolean;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: FineTuningConfig = {
  minExamplesRequired: 50,
  maxExamplesPerJob: 10000,
  defaultHyperparameters: {
    nEpochs: 3,
    batchSize: 4,
    learningRateMultiplier: 1.0,
  },
  qualityThreshold: 0.7,
  autoDeployOnSuccess: false,
};

// ============================================================================
// Azure Fine-Tuning Service
// ============================================================================

export class AzureFineTuningService {
  private jobs: Map<string, FineTuningJob> = new Map();
  private examples: Map<string, TrainingExample[]> = new Map(); // creatorId -> examples
  private models: Map<string, FineTunedModel> = new Map();
  private config: FineTuningConfig;

  constructor(config: Partial<FineTuningConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ==========================================================================
  // Training Data Collection
  // ==========================================================================

  /**
   * Add a training example for a creator
   */
  addTrainingExample(example: Omit<TrainingExample, 'id' | 'createdAt'>): TrainingExample {
    const id = this.generateId('example');
    const newExample: TrainingExample = {
      ...example,
      id,
      createdAt: new Date(),
    };

    const creatorExamples = this.examples.get(example.creatorId) || [];
    creatorExamples.push(newExample);
    this.examples.set(example.creatorId, creatorExamples);

    return newExample;
  }

  /**
   * Get training examples for a creator
   */
  getTrainingExamples(
    creatorId: string,
    options: { quality?: 'high' | 'medium' | 'low'; category?: string; limit?: number } = {}
  ): TrainingExample[] {
    let examples = this.examples.get(creatorId) || [];

    if (options.quality) {
      examples = examples.filter(e => e.quality === options.quality);
    }

    if (options.category) {
      examples = examples.filter(e => e.category === options.category);
    }

    if (options.limit) {
      examples = examples.slice(0, options.limit);
    }

    return examples;
  }

  /**
   * Get training data statistics for a creator
   */
  getTrainingStats(creatorId: string): {
    totalExamples: number;
    byQuality: Record<string, number>;
    byCategory: Record<string, number>;
    readyForFineTuning: boolean;
  } {
    const examples = this.examples.get(creatorId) || [];

    const byQuality: Record<string, number> = { high: 0, medium: 0, low: 0 };
    const byCategory: Record<string, number> = {};

    for (const example of examples) {
      byQuality[example.quality]++;
      byCategory[example.category] = (byCategory[example.category] || 0) + 1;
    }

    const highQualityCount = byQuality.high + byQuality.medium;

    return {
      totalExamples: examples.length,
      byQuality,
      byCategory,
      readyForFineTuning: highQualityCount >= this.config.minExamplesRequired,
    };
  }

  /**
   * Remove low quality examples
   */
  pruneExamples(creatorId: string, quality: 'low' | 'medium'): number {
    const examples = this.examples.get(creatorId) || [];
    const filtered = examples.filter(e => e.quality !== quality);
    const removed = examples.length - filtered.length;
    this.examples.set(creatorId, filtered);
    return removed;
  }

  // ==========================================================================
  // Fine-Tuning Job Management
  // ==========================================================================

  /**
   * Create a fine-tuning job
   */
  createFineTuningJob(
    creatorId: string,
    baseModel: string,
    options: {
      hyperparameters?: Partial<FineTuningHyperparameters>;
      validationSplit?: number;
    } = {}
  ): FineTuningJob {
    // Validate minimum examples
    const stats = this.getTrainingStats(creatorId);
    if (!stats.readyForFineTuning) {
      throw new Error(
        `Insufficient training data. Need ${this.config.minExamplesRequired} high/medium quality examples, have ${stats.byQuality.high + stats.byQuality.medium}`
      );
    }

    const id = this.generateId('job');
    const trainingFile = this.prepareTrainingFile(creatorId, options.validationSplit);

    const job: FineTuningJob = {
      id,
      creatorId,
      baseModel,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      trainingFile,
      hyperparameters: {
        ...this.config.defaultHyperparameters,
        ...options.hyperparameters,
      },
    };

    this.jobs.set(id, job);

    // Simulate job starting
    this.simulateJobProgress(id);

    return job;
  }

  /**
   * Get a fine-tuning job
   */
  getJob(jobId: string): FineTuningJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs for a creator
   */
  getCreatorJobs(creatorId: string): FineTuningJob[] {
    return Array.from(this.jobs.values())
      .filter(j => j.creatorId === creatorId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Cancel a fine-tuning job
   */
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    if (job.status === 'succeeded' || job.status === 'failed' || job.status === 'cancelled') {
      return false;
    }

    job.status = 'cancelled';
    job.updatedAt = new Date();
    return true;
  }

  /**
   * Update job status (for simulation/testing)
   */
  updateJobStatus(
    jobId: string,
    status: FineTuningStatus,
    metrics?: FineTuningMetrics,
    resultModel?: string
  ): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    job.status = status;
    job.updatedAt = new Date();

    if (status === 'succeeded') {
      job.completedAt = new Date();
      job.metrics = metrics;
      job.resultModel = resultModel || `ft:${job.baseModel}:${job.creatorId}:${job.id}`;

      // Auto-deploy if configured
      if (this.config.autoDeployOnSuccess) {
        this.deployFineTunedModel(jobId);
      }
    }

    if (status === 'failed') {
      job.completedAt = new Date();
    }

    return true;
  }

  // ==========================================================================
  // Fine-Tuned Model Deployment
  // ==========================================================================

  /**
   * Deploy a fine-tuned model
   */
  deployFineTunedModel(jobId: string): FineTunedModel {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    if (job.status !== 'succeeded') {
      throw new Error(`Job not succeeded: ${job.status}`);
    }

    if (!job.resultModel) {
      throw new Error('Job has no result model');
    }

    const id = this.generateId('model');
    const deployment = `ft-${job.creatorId}-${id}`;

    const model: FineTunedModel = {
      id,
      creatorId: job.creatorId,
      jobId,
      baseModel: job.baseModel,
      deployment,
      status: 'deploying',
      createdAt: new Date(),
      performance: {
        avgLatency: 0,
        avgQualityScore: 0,
        requestCount: 0,
        costPerRequest: 0,
        comparisonToBase: {
          latencyImprovement: 0,
          qualityImprovement: 0,
          costDifference: 0,
        },
      },
    };

    this.models.set(id, model);

    // Simulate deployment completion
    setTimeout(() => {
      model.status = 'active';
    }, 100);

    return model;
  }

  /**
   * Get a fine-tuned model
   */
  getFineTunedModel(modelId: string): FineTunedModel | undefined {
    return this.models.get(modelId);
  }

  /**
   * Get all fine-tuned models for a creator
   */
  getCreatorModels(creatorId: string): FineTunedModel[] {
    return Array.from(this.models.values())
      .filter(m => m.creatorId === creatorId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get active fine-tuned model for a creator
   */
  getActiveModel(creatorId: string): FineTunedModel | undefined {
    return Array.from(this.models.values())
      .find(m => m.creatorId === creatorId && m.status === 'active');
  }

  /**
   * Deactivate a fine-tuned model
   */
  deactivateModel(modelId: string): boolean {
    const model = this.models.get(modelId);
    if (!model) return false;

    model.status = 'inactive';
    return true;
  }

  /**
   * Delete a fine-tuned model
   */
  deleteModel(modelId: string): boolean {
    const model = this.models.get(modelId);
    if (!model) return false;

    model.status = 'deleted';
    return true;
  }

  // ==========================================================================
  // Performance Comparison
  // ==========================================================================

  /**
   * Update model performance metrics
   */
  updateModelPerformance(
    modelId: string,
    latency: number,
    qualityScore: number,
    cost: number
  ): void {
    const model = this.models.get(modelId);
    if (!model) return;

    const perf = model.performance;
    perf.requestCount++;

    // Update running averages
    perf.avgLatency = this.updateRunningAverage(perf.avgLatency, latency, perf.requestCount);
    perf.avgQualityScore = this.updateRunningAverage(perf.avgQualityScore, qualityScore, perf.requestCount);
    perf.costPerRequest = this.updateRunningAverage(perf.costPerRequest, cost, perf.requestCount);
  }

  /**
   * Compare fine-tuned model to base model
   */
  compareToBase(
    modelId: string,
    baseMetrics: { avgLatency: number; avgQualityScore: number; costPerRequest: number }
  ): PerformanceComparison {
    const model = this.models.get(modelId);
    if (!model || model.performance.requestCount === 0) {
      return {
        latencyImprovement: 0,
        qualityImprovement: 0,
        costDifference: 0,
      };
    }

    const perf = model.performance;

    const comparison: PerformanceComparison = {
      latencyImprovement: baseMetrics.avgLatency > 0
        ? ((baseMetrics.avgLatency - perf.avgLatency) / baseMetrics.avgLatency) * 100
        : 0,
      qualityImprovement: baseMetrics.avgQualityScore > 0
        ? ((perf.avgQualityScore - baseMetrics.avgQualityScore) / baseMetrics.avgQualityScore) * 100
        : 0,
      costDifference: baseMetrics.costPerRequest > 0
        ? ((perf.costPerRequest - baseMetrics.costPerRequest) / baseMetrics.costPerRequest) * 100
        : 0,
    };

    // Update stored comparison
    perf.comparisonToBase = comparison;

    return comparison;
  }

  /**
   * Get performance summary for all creator models
   */
  getPerformanceSummary(creatorId: string): {
    models: Array<{
      id: string;
      deployment: string;
      status: string;
      performance: ModelPerformance;
    }>;
    bestModel?: string;
  } {
    const models = this.getCreatorModels(creatorId)
      .filter(m => m.status !== 'deleted')
      .map(m => ({
        id: m.id,
        deployment: m.deployment,
        status: m.status,
        performance: m.performance,
      }));

    // Find best model by quality score
    let bestModel: string | undefined;
    let bestScore = 0;

    for (const model of models) {
      if (model.performance.avgQualityScore > bestScore && model.status === 'active') {
        bestScore = model.performance.avgQualityScore;
        bestModel = model.id;
      }
    }

    return { models, bestModel };
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private generateId(prefix: string): string {
    const data = `${prefix}-${Date.now()}-${Math.random()}`;
    return createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  private prepareTrainingFile(creatorId: string, validationSplit?: number): string {
    const examples = this.getTrainingExamples(creatorId, { quality: 'high' });
    const mediumExamples = this.getTrainingExamples(creatorId, { quality: 'medium' });
    
    const allExamples = [...examples, ...mediumExamples]
      .slice(0, this.config.maxExamplesPerJob);

    // In real implementation, this would upload to Azure Blob Storage
    // and return the file ID
    return `training-${creatorId}-${Date.now()}.jsonl`;
  }

  private simulateJobProgress(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    // Simulate async job progression
    setTimeout(() => {
      if (job.status === 'cancelled') return;
      job.status = 'validating';
      job.updatedAt = new Date();
    }, 50);

    setTimeout(() => {
      if (job.status === 'cancelled') return;
      job.status = 'queued';
      job.updatedAt = new Date();
    }, 100);

    setTimeout(() => {
      if (job.status === 'cancelled') return;
      job.status = 'running';
      job.updatedAt = new Date();
    }, 150);
  }

  private updateRunningAverage(currentAvg: number, newValue: number, count: number): number {
    return currentAvg + (newValue - currentAvg) / count;
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

let instance: AzureFineTuningService | null = null;

export function getAzureFineTuning(): AzureFineTuningService {
  if (!instance) {
    instance = new AzureFineTuningService();
  }
  return instance;
}
