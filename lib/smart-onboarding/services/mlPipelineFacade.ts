/**
 * ML Pipeline Facade
 * 
 * Façade minimale pour les opérations de pipeline ML (training, deployment, versioning, predict, endpoints).
 * Isole les routes API de l'implémentation ML sous-jacente.
 * 
 * Features:
 * - Error handling with retry strategies
 * - Request/response logging
 * - Type-safe API responses
 * - Circuit breaker pattern for resilience
 * - Performance monitoring
 * 
 * @module mlPipelineFacade
 */

import { mlModelManager } from './mlModelManager';
import { mlTrainingPipeline, TrainingPipelineConfig } from './mlTrainingPipeline';
import { modelDeploymentService, DeploymentStrategy } from './modelDeploymentService';
import { modelVersioningService } from './modelVersioningService';
import { PredictionRequest } from '../types';
import { logger } from '@/lib/utils/logger';

// ============ TYPES ============

/**
 * Standard API response wrapper
 */
export interface MLApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    requestId: string;
    timestamp: string;
    duration: number;
  };
}

/**
 * Retry configuration
 */
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

/**
 * Circuit breaker state
 */
interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'closed' | 'open' | 'half-open';
}

// ============ CONSTANTS ============

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute

// ============ STATE ============

const circuitBreakers = new Map<string, CircuitBreakerState>();

// ============ UTILITIES ============

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `ml-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Wrap function with error handling and logging
 */
async function withErrorHandling<T>(
  operation: string,
  fn: () => Promise<T>,
  retryConfig: Partial<RetryConfig> = {}
): Promise<MLApiResponse<T>> {
  const requestId = generateRequestId();
  const startTime = Date.now();
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };

  logger.info(`[ML Pipeline] ${operation} started`, {
    requestId,
    operation,
  });

  try {
    // Check circuit breaker
    if (isCircuitOpen(operation)) {
      throw new Error(`Circuit breaker open for ${operation}`);
    }

    // Execute with retry
    const data = await retryWithBackoff(fn, config, operation);

    // Reset circuit breaker on success
    resetCircuitBreaker(operation);

    const duration = Date.now() - startTime;

    logger.info(`[ML Pipeline] ${operation} succeeded`, {
      requestId,
      operation,
      duration,
    });

    return {
      success: true,
      data,
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        duration,
      },
    };
  } catch (error: any) {
    // Record failure for circuit breaker
    recordFailure(operation);

    const duration = Date.now() - startTime;

    logger.error(`[ML Pipeline] ${operation} failed`, {
      requestId,
      operation,
      duration,
      error: error.message,
    }, error);

    return {
      success: false,
      error: {
        code: error.code || 'ML_PIPELINE_ERROR',
        message: error.message || 'Unknown error occurred',
        details: error.details || {},
      },
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        duration,
      },
    };
  }
}

/**
 * Retry with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig,
  operation: string
): Promise<T> {
  let lastError: Error;
  let delay = config.initialDelay;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry on certain errors
      if (isNonRetryableError(error)) {
        throw error;
      }

      if (attempt < config.maxRetries) {
        logger.warn(`[ML Pipeline] ${operation} attempt ${attempt + 1} failed, retrying in ${delay}ms`, {
          operation,
          attempt: attempt + 1,
          maxRetries: config.maxRetries,
          delay,
          error: error.message,
        });

        await sleep(delay);
        delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
      }
    }
  }

  throw lastError!;
}

/**
 * Check if error is non-retryable
 */
function isNonRetryableError(error: any): boolean {
  const nonRetryableCodes = [
    'INVALID_INPUT',
    'UNAUTHORIZED',
    'FORBIDDEN',
    'NOT_FOUND',
    'VALIDATION_ERROR',
  ];

  return nonRetryableCodes.includes(error.code);
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if circuit breaker is open
 */
function isCircuitOpen(operation: string): boolean {
  const breaker = circuitBreakers.get(operation);
  
  if (!breaker) {
    return false;
  }

  if (breaker.state === 'closed') {
    return false;
  }

  if (breaker.state === 'open') {
    // Check if timeout has passed
    if (Date.now() - breaker.lastFailureTime > CIRCUIT_BREAKER_TIMEOUT) {
      breaker.state = 'half-open';
      return false;
    }
    return true;
  }

  // half-open state
  return false;
}

/**
 * Record failure for circuit breaker
 */
function recordFailure(operation: string): void {
  const breaker = circuitBreakers.get(operation) || {
    failures: 0,
    lastFailureTime: 0,
    state: 'closed' as const,
  };

  breaker.failures++;
  breaker.lastFailureTime = Date.now();

  if (breaker.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    breaker.state = 'open';
    logger.warn(`[ML Pipeline] Circuit breaker opened for ${operation}`, {
      operation,
      failures: breaker.failures,
    });
  }

  circuitBreakers.set(operation, breaker);
}

/**
 * Reset circuit breaker on success
 */
function resetCircuitBreaker(operation: string): void {
  const breaker = circuitBreakers.get(operation);
  
  if (breaker) {
    breaker.failures = 0;
    breaker.state = 'closed';
    circuitBreakers.set(operation, breaker);
  }
}

// ============ FACADE ============

export const mlPipelineFacade = {
  // ============ PREDICT ============
  
  /**
   * Make a prediction using ML model
   * 
   * @param request - Prediction request with model type and input data
   * @returns Prediction result with confidence scores
   * 
   * @example
   * ```typescript
   * const result = await mlPipelineFacade.predict({
   *   modelType: 'success-prediction',
   *   userId: 123,
   *   features: { ... }
   * });
   * ```
   */
  async predict(request: PredictionRequest): Promise<MLApiResponse> {
    return withErrorHandling(
      'predict',
      () => mlModelManager.predict(request),
      { maxRetries: 2 } // Predictions should be fast
    );
  },

  /**
   * Get model statistics and performance metrics
   * 
   * @param modelType - Optional model type filter
   * @returns Model statistics including accuracy, latency, etc.
   */
  async getModelStats(modelType?: string): Promise<MLApiResponse> {
    return withErrorHandling(
      'getModelStats',
      () => mlModelManager.getModelStats(modelType)
    );
  },

  /**
   * Warmup models by loading them into memory
   * 
   * @param modelTypes - Array of model types to warmup
   * @returns Warmup results for each model
   */
  async warmupModels(modelTypes: string[]): Promise<MLApiResponse> {
    return withErrorHandling(
      'warmupModels',
      () => mlModelManager.warmupModels(modelTypes),
      { maxRetries: 1 } // Don't retry warmup too much
    );
  },

  // ============ TRAINING ============
  
  /**
   * Schedule a new training job
   * 
   * @param config - Training configuration including model type, data, hyperparameters
   * @returns Training job ID and initial status
   * 
   * @example
   * ```typescript
   * const result = await mlPipelineFacade.scheduleTraining({
   *   modelType: 'success-prediction',
   *   datasetId: 'dataset-123',
   *   hyperparameters: { learningRate: 0.001 }
   * });
   * ```
   */
  async scheduleTraining(config: TrainingPipelineConfig): Promise<MLApiResponse> {
    return withErrorHandling(
      'scheduleTraining',
      () => mlTrainingPipeline.scheduleTraining(config),
      { maxRetries: 1 } // Don't retry training scheduling too much
    );
  },

  /**
   * Get training job status
   * 
   * @param jobId - Training job ID
   * @returns Current status, progress, and metrics
   */
  async getTrainingStatus(jobId: string): Promise<MLApiResponse> {
    return withErrorHandling(
      'getTrainingStatus',
      () => mlTrainingPipeline.getTrainingStatus(jobId)
    );
  },

  /**
   * Get training history for a model type
   * 
   * @param modelType - Optional model type filter
   * @returns List of past training jobs with results
   */
  async getTrainingHistory(modelType?: string): Promise<MLApiResponse> {
    return withErrorHandling(
      'getTrainingHistory',
      () => mlTrainingPipeline.getTrainingHistory(modelType)
    );
  },

  /**
   * Get training queue status
   * 
   * @returns Queue depth, pending jobs, active jobs
   */
  async getQueueStatus(): Promise<MLApiResponse> {
    return withErrorHandling(
      'getQueueStatus',
      () => mlTrainingPipeline.getQueueStatus()
    );
  },

  /**
   * Cancel a training job
   * 
   * @param jobId - Training job ID to cancel
   * @returns Cancellation confirmation
   */
  async cancelTraining(jobId: string): Promise<MLApiResponse> {
    return withErrorHandling(
      'cancelTraining',
      () => mlTrainingPipeline.cancelTraining(jobId),
      { maxRetries: 2 } // Retry cancellation if it fails
    );
  },

  // ============ DEPLOYMENT ============
  
  /**
   * Deploy a trained model to production
   * 
   * @param modelType - Model type to deploy
   * @param modelVersion - Model version to deploy
   * @param strategy - Deployment strategy (blue-green, canary, rolling)
   * @returns Deployment ID and status
   * 
   * @example
   * ```typescript
   * const result = await mlPipelineFacade.deployModel(
   *   'success-prediction',
   *   'v1.2.3',
   *   'canary'
   * );
   * ```
   */
  async deployModel(
    modelType: string,
    modelVersion: string,
    strategy: DeploymentStrategy
  ): Promise<MLApiResponse> {
    return withErrorHandling(
      'deployModel',
      () => modelDeploymentService.deployModel(modelType, modelVersion, strategy),
      { maxRetries: 1 } // Don't retry deployments automatically
    );
  },

  /**
   * Get deployment status
   * 
   * @param deploymentId - Deployment ID
   * @returns Current deployment status and health metrics
   */
  async getDeploymentStatus(deploymentId: string): Promise<MLApiResponse> {
    return withErrorHandling(
      'getDeploymentStatus',
      () => modelDeploymentService.getDeploymentStatus(deploymentId)
    );
  },

  /**
   * Get all active deployments
   * 
   * @returns List of currently active deployments
   */
  async getActiveDeployments(): Promise<MLApiResponse> {
    return withErrorHandling(
      'getActiveDeployments',
      () => modelDeploymentService.getActiveDeployments()
    );
  },

  /**
   * Get deployment history
   * 
   * @param modelType - Optional model type filter
   * @returns List of past deployments with outcomes
   */
  async getDeploymentHistory(modelType?: string): Promise<MLApiResponse> {
    return withErrorHandling(
      'getDeploymentHistory',
      () => modelDeploymentService.getDeploymentHistory(modelType)
    );
  },

  /**
   * Rollback a deployment to previous version
   * 
   * @param deploymentId - Deployment ID to rollback
   * @returns Rollback confirmation and new deployment ID
   */
  async rollbackDeployment(deploymentId: string): Promise<MLApiResponse> {
    return withErrorHandling(
      'rollbackDeployment',
      () => modelDeploymentService.rollbackDeployment(deploymentId),
      { maxRetries: 2 } // Retry rollback if it fails
    );
  },

  // ============ ENDPOINTS ============
  
  /**
   * Get model endpoints for a model type
   * 
   * @param modelType - Model type
   * @returns List of available endpoints with URLs and versions
   */
  async getModelEndpoints(modelType: string): Promise<MLApiResponse> {
    return withErrorHandling(
      'getModelEndpoints',
      () => modelDeploymentService.getModelEndpoints(modelType)
    );
  },

  /**
   * Update traffic split between model versions
   * 
   * @param modelType - Model type
   * @param trafficSplits - Traffic split percentages by version (must sum to 100)
   * @returns Updated traffic configuration
   * 
   * @example
   * ```typescript
   * await mlPipelineFacade.updateTrafficSplit('success-prediction', {
   *   'v1.2.3': 90,
   *   'v1.2.4': 10
   * });
   * ```
   */
  async updateTrafficSplit(
    modelType: string,
    trafficSplits: Record<string, number>
  ): Promise<MLApiResponse> {
    return withErrorHandling(
      'updateTrafficSplit',
      () => modelDeploymentService.updateTrafficSplit(modelType, trafficSplits),
      { maxRetries: 2 } // Retry traffic updates
    );
  },

  // ============ VERSIONING ============
  
  /**
   * Create a new model version
   * 
   * @param modelId - Model identifier
   * @param modelData - Serialized model data
   * @param metadata - Version metadata (metrics, hyperparameters, etc.)
   * @param parentVersion - Optional parent version for lineage
   * @returns New version identifier
   */
  async createVersion(
    modelId: string,
    modelData: any,
    metadata: any,
    parentVersion?: string
  ): Promise<MLApiResponse> {
    return withErrorHandling(
      'createVersion',
      () => modelVersioningService.createVersion(modelId, modelData, metadata, parentVersion),
      { maxRetries: 1 } // Don't retry version creation
    );
  },

  /**
   * Get a specific model version
   * 
   * @param modelId - Model identifier
   * @param version - Version identifier
   * @returns Model version data and metadata
   */
  async getVersion(modelId: string, version: string): Promise<MLApiResponse> {
    return withErrorHandling(
      'getVersion',
      () => modelVersioningService.getVersion(modelId, version)
    );
  },

  /**
   * List all versions for a model
   * 
   * @param modelId - Model identifier
   * @param options - Optional filters and pagination
   * @returns List of model versions
   */
  async listVersions(modelId: string, options?: any): Promise<MLApiResponse> {
    return withErrorHandling(
      'listVersions',
      () => modelVersioningService.listVersions(modelId, options)
    );
  },

  /**
   * Compare two model versions
   * 
   * @param modelId - Model identifier
   * @param fromVersion - Source version
   * @param toVersion - Target version
   * @returns Comparison results with metrics diff
   */
  async compareVersions(
    modelId: string,
    fromVersion: string,
    toVersion: string
  ): Promise<MLApiResponse> {
    return withErrorHandling(
      'compareVersions',
      () => modelVersioningService.compareVersions(modelId, fromVersion, toVersion)
    );
  },

  /**
   * Get model lineage (version history tree)
   * 
   * @param modelId - Model identifier
   * @returns Version lineage graph
   */
  async getModelLineage(modelId: string): Promise<MLApiResponse> {
    return withErrorHandling(
      'getModelLineage',
      () => modelVersioningService.getModelLineage(modelId)
    );
  },

  /**
   * Export a model version
   * 
   * @param modelId - Model identifier
   * @param version - Version to export
   * @param format - Export format (json or binary)
   * @returns Exported model data
   */
  async exportVersion(
    modelId: string,
    version: string,
    format: 'json' | 'binary'
  ): Promise<MLApiResponse> {
    return withErrorHandling(
      'exportVersion',
      () => modelVersioningService.exportVersion(modelId, version, format),
      { maxRetries: 1 } // Don't retry exports too much
    );
  },

  /**
   * Import a model version
   * 
   * @param importData - Exported model data
   * @returns Imported version identifier
   */
  async importVersion(importData: any): Promise<MLApiResponse> {
    return withErrorHandling(
      'importVersion',
      () => modelVersioningService.importVersion(importData),
      { maxRetries: 1 } // Don't retry imports
    );
  },

  /**
   * Create a version tag (e.g., 'production', 'staging')
   * 
   * @param modelId - Model identifier
   * @param tagName - Tag name
   * @param version - Version to tag
   * @param description - Tag description
   * @param metadata - Additional metadata
   * @returns Tag creation confirmation
   */
  async createTag(
    modelId: string,
    tagName: string,
    version: string,
    description: string,
    metadata: any
  ): Promise<MLApiResponse> {
    return withErrorHandling(
      'createTag',
      () => modelVersioningService.createTag(modelId, tagName, version, description, metadata)
    );
  },

  /**
   * Create a version branch for experimentation
   * 
   * @param modelId - Model identifier
   * @param branchName - Branch name
   * @param baseVersion - Base version for branch
   * @param description - Branch description
   * @returns Branch creation confirmation
   */
  async createBranch(
    modelId: string,
    branchName: string,
    baseVersion: string,
    description: string
  ): Promise<MLApiResponse> {
    return withErrorHandling(
      'createBranch',
      () => modelVersioningService.createBranch(modelId, branchName, baseVersion, description)
    );
  },

  /**
   * Rollback to a previous version
   * 
   * @param modelId - Model identifier
   * @param targetVersion - Version to rollback to
   * @returns Rollback confirmation
   */
  async rollbackToVersion(modelId: string, targetVersion: string): Promise<MLApiResponse> {
    return withErrorHandling(
      'rollbackToVersion',
      () => modelVersioningService.rollbackToVersion(modelId, targetVersion),
      { maxRetries: 2 } // Retry rollback
    );
  },

  /**
   * Delete a model version
   * 
   * @param modelId - Model identifier
   * @param version - Version to delete
   * @param force - Force deletion even if version is in use
   * @returns Deletion confirmation
   */
  async deleteVersion(modelId: string, version: string, force: boolean): Promise<MLApiResponse> {
    return withErrorHandling(
      'deleteVersion',
      () => modelVersioningService.deleteVersion(modelId, version, force),
      { maxRetries: 1 } // Don't retry deletions too much
    );
  },
};
