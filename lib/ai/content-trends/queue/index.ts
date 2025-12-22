/**
 * Content Trends Queue Module
 * 
 * BullMQ-based asynchronous processing for AI inference tasks.
 * Provides job prioritization, rate limiting, retry mechanisms,
 * and circuit breaker patterns.
 * 
 * @see .kiro/specs/content-trends-ai-engine/design.md - Section 4
 */

// Types
export {
  JobPriority,
  JobStatus,
  QueueName,
  type BaseJobData,
  type VideoProcessingJobData,
  type VisualAnalysisJobData,
  type TextAnalysisJobData,
  type ViralPredictionJobData,
  type ContentGenerationJobData,
  type WebhookProcessingJobData,
  type ContentTrendsJobData,
  type JobResult,
  type QueueConfig,
  type WorkerConfig,
  type QueueMetrics,
  type QueueEventType,
  type QueueEvent,
} from './types';

// Queue Manager
export {
  ContentTrendsQueueManager,
  getQueueManager,
  createQueueManager,
} from './queue-manager';

// Workers
export {
  BaseWorker,
  RateLimitError,
  ProcessingError,
  VideoProcessingWorker,
  createVideoProcessingWorker,
  VisualAnalysisWorker,
  createVisualAnalysisWorker,
  TextAnalysisWorker,
  createTextAnalysisWorker,
  type WorkerMetrics,
  type RateLimiterConfig,
  type VideoProcessingWorkerResult,
  type VisualAnalysisWorkerResult,
  type TextAnalysisWorkerResult,
} from './workers';

// Retry Service
export {
  RetryService,
  getRetryService,
  createRetryService,
  withRetry,
  type RetryConfig,
  type RetryAttempt,
  type RetryResult,
} from './retry-service';

// Circuit Breaker
export {
  CircuitBreaker,
  CircuitState,
  CircuitOpenError,
  CircuitBreakerRegistry,
  getCircuitBreakerRegistry,
  createCircuitBreaker,
  type CircuitBreakerConfig,
  type CircuitBreakerMetrics,
} from './circuit-breaker';
